import { propertyMatchScore } from '@/lib/matching/propertyMatchScore';

const BATCH_SIZE = 50;

export async function recomputeForSeeker(adminSb, seekerId) {
  const [lifestyleResult, prefsResult, userResult] = await Promise.all([
    adminSb.from('user_lifestyles').select('*').eq('user_id', seekerId).single(),
    adminSb.from('match_preferences').select('*').eq('user_id', seekerId).single(),
    adminSb.from('users').select('date_of_birth, gender').eq('id', seekerId).single(),
  ]);

  const lifestyle = lifestyleResult.data;
  const preferences = prefsResult.data;
  const seekerMeta = userResult.data || {};

  // If the seeker hasn't completed their profile, they can't have match scores.
  // Note: uses && to match propertyMatchScore's own null condition (only nulls if BOTH are missing)
  if (!lifestyle && !preferences) {
      return { updated: 0, reason: 'missing_profile' };
  }

  let offset = 0;
  let hasMore = true;
  const scoreRows = [];

  while (hasMore) {
    const { data: properties, error: propError } = await adminSb
      .from('properties')
      .select(`
        id, city, state, price_per_month, gender_preference, occupation_preference,
        age_min, age_max, lifestyle_priorities, deal_breakers, min_stay_months,
        bills_option, couples_allowed, available_from, is_immediate, privacy_setting, is_public,
        offering_type, listed_by_user_id
      `)
      .eq('is_active', true)
      .neq('listed_by_user_id', seekerId)
      .order('id')
      .range(offset, offset + BATCH_SIZE - 1);

    if (propError) {
      console.error('[Recompute] Properties query error:', propError);
      break;
    }

    if (!properties || properties.length === 0) {
      hasMore = false;
      break;
    }

    // Fetch host data separately to avoid fragile FK join aliases
    const hostIds = [...new Set(properties.map(p => p.listed_by_user_id).filter(Boolean))];
    const [hostMetaResult, hostLifestyleResult] = await Promise.all([
      adminSb.from('users').select('id, date_of_birth, gender').in('id', hostIds),
      adminSb.from('user_lifestyles').select('user_id, cleanliness_level, overnight_guests, occupation, smoking_status').in('user_id', hostIds),
    ]);

    const hostMetaMap = Object.fromEntries((hostMetaResult.data || []).map(u => [u.id, u]));
    const hostLifestyleMap = Object.fromEntries((hostLifestyleResult.data || []).map(u => [u.user_id, u]));

    for (const property of properties) {
      const hostMeta = hostMetaMap[property.listed_by_user_id] || {};
      const hostLifestyle = hostLifestyleMap[property.listed_by_user_id] || null;

      const score = propertyMatchScore(property, lifestyle, preferences, seekerMeta, hostLifestyle, hostMeta);
      // Skip null scores -- these indicate an invalid/incomplete pairing, not a 0% match
      if (score !== null) {
        scoreRows.push({
          seeker_id: seekerId,
          property_id: property.id,
          score,
          computed_at: new Date().toISOString(),
        });
      }
    }

    offset += BATCH_SIZE;
    if (properties.length < BATCH_SIZE) hasMore = false;
  }

  console.log(`[Recompute] Seeker ${seekerId}: ${scoreRows.length} total scores computed`);
  if (scoreRows.length > 0) {
    // Deduplicate to prevent "ON CONFLICT DO UPDATE command cannot affect row a second time"
    const uniqueMap = new Map();
    for (const row of scoreRows) {
        uniqueMap.set(`${row.seeker_id}-${row.property_id}`, row);
    }
    const uniqueRows = Array.from(uniqueMap.values());

    const { error: upsertError } = await adminSb
      .from('compatibility_scores')
      .upsert(uniqueRows, { onConflict: 'seeker_id,property_id' });
    if (upsertError) {
      console.error('[Recompute] Upsert error:', upsertError);
    }
  }

  return { updated: scoreRows.length };
}

export async function recomputeForProperty(adminSb, propertyId) {
  const { data: property } = await adminSb
    .from('properties')
    .select(`
      id, city, state, price_per_month, gender_preference, occupation_preference,
      age_min, age_max, lifestyle_priorities, deal_breakers, min_stay_months,
      bills_option, couples_allowed, available_from, is_immediate, privacy_setting, is_public,
      offering_type, listed_by_user_id,
      users!listed_by_user_id (date_of_birth, gender)
    `)
    .eq('id', propertyId)
    .single();

  if (!property) return { updated: 0 };

  // Extract Host Data
  const hostMeta = Array.isArray(property.users) ? property.users[0] : property.users || {};
  const { data: hostLifestyleRows } = await adminSb
    .from('user_lifestyles')
    .select('user_id, cleanliness_level, overnight_guests, occupation, smoking_status')
    .eq('user_id', property.listed_by_user_id)
    .limit(1);
  const hostLifestyle = Array.isArray(hostLifestyleRows) ? hostLifestyleRows[0] : hostLifestyleRows || null;

  let offset = 0;
  let hasMore = true;
  const scoreRows = [];

  while (hasMore) {
    const { data: seekers } = await adminSb
      .from('user_lifestyles')
      .select(`
        user_id,
        cleanliness_level, schedule_type, smoking_status, social_level,
        noise_tolerance, pets, interests, occupation, current_city,
        preferred_room_types, preferred_property_types, move_in_urgency, min_stay, max_stay
      `)
      .neq('user_id', property.listed_by_user_id)
      .order('user_id')
      .range(offset, offset + BATCH_SIZE - 1);

    if (!seekers || seekers.length === 0) {
      hasMore = false;
      break;
    }

    const seekerIds = seekers.map((seeker) => seeker.user_id).filter(Boolean);
    const [prefsResult, userMetaResult] = await Promise.all([
      adminSb
        .from('match_preferences')
        .select(`
          user_id,
          budget_min, budget_max, location_areas, gender_preference,
          accepted_smoking, accepted_pets, stay_duration_min, stay_duration_max,
          move_in_window, occupation_preference, cleanliness_tolerance, guests_tolerance,
          age_min, age_max
        `)
        .in('user_id', seekerIds),
      adminSb
        .from('users')
        .select('id, date_of_birth, gender')
        .in('id', seekerIds),
    ]);

    const prefsByUserId = Object.fromEntries((prefsResult.data || []).map((pref) => [pref.user_id, pref]));
    const userMetaById = Object.fromEntries((userMetaResult.data || []).map((user) => [user.id, user]));

    for (const seeker of seekers) {
      const prefs = prefsByUserId[seeker.user_id];
      if (!prefs) continue;
      const userMeta = userMetaById[seeker.user_id] || {};

      const lifestyle = {
        cleanliness_level: seeker.cleanliness_level,
        schedule_type: seeker.schedule_type,
        smoking_status: seeker.smoking_status,
        social_level: seeker.social_level,
        noise_tolerance: seeker.noise_tolerance,
        pets: seeker.pets,
        interests: seeker.interests,
        occupation: seeker.occupation || userMeta?.occupation,
        current_city: seeker.current_city,
      };

      const score = propertyMatchScore(property, lifestyle, prefs, userMeta, hostLifestyle, hostMeta);
      scoreRows.push({
        seeker_id: seeker.user_id,
        property_id: propertyId,
        score,
        computed_at: new Date().toISOString(),
      });
    }

    offset += BATCH_SIZE;
    if (seekers.length < BATCH_SIZE) hasMore = false;
  }

  if (scoreRows.length > 0) {
    // Deduplicate to prevent "ON CONFLICT DO UPDATE command cannot affect row a second time"
    const uniqueMap = new Map();
    for (const row of scoreRows) {
        uniqueMap.set(`${row.seeker_id}-${row.property_id}`, row);
    }
    const uniqueRows = Array.from(uniqueMap.values());

    await adminSb
      .from('compatibility_scores')
      .upsert(uniqueRows, { onConflict: 'seeker_id,property_id' });
  }

  return { updated: scoreRows.length };
}
