import { propertyMatchScore } from '../../../lib/matching/propertyMatchScore.js';
import {
  buildSeekerLifestyle,
  hasMatchingProfile,
  isEligiblePropertyForMatching,
  mergeUniqueUserIds,
} from './recompute-helpers.js';

const BATCH_SIZE = 50;

async function fetchPagedRows(queryFactory, pageSize = BATCH_SIZE) {
  const rows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await queryFactory(offset, pageSize);
    if (error) throw error;
    if (!data?.length) break;

    rows.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

export async function recomputeForSeeker(adminSb, seekerId) {
  const [lifestyleResult, prefsResult, userResult] = await Promise.all([
    adminSb.from('user_lifestyles').select('*').eq('user_id', seekerId).single(),
    adminSb.from('match_preferences').select('*').eq('user_id', seekerId).single(),
    adminSb.from('users').select('date_of_birth, gender').eq('id', seekerId).single(),
  ]);

  const lifestyle = lifestyleResult.data;
  const preferences = prefsResult.data;
  const seekerMeta = userResult.data || {};

  if (!hasMatchingProfile({ lifestyle, preferences })) {
    await adminSb.from('compatibility_scores').delete().eq('seeker_id', seekerId);
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
        offering_type, listed_by_user_id, approval_status, is_active
      `)
      .eq('is_active', true)
      .eq('approval_status', 'approved')
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
      adminSb.from('user_lifestyles').select('user_id, cleanliness_level, overnight_guests, occupation, smoking_status, pets, schedule_type, social_level, noise_tolerance, interests').in('user_id', hostIds),
    ]);

    const hostMetaMap = Object.fromEntries((hostMetaResult.data || []).map(u => [u.id, u]));
    const hostLifestyleMap = Object.fromEntries((hostLifestyleResult.data || []).map(u => [u.user_id, u]));

    for (const property of properties) {
      if (!isEligiblePropertyForMatching(property)) continue;

      const hostMeta = hostMetaMap[property.listed_by_user_id] || {};
      const hostLifestyle = hostLifestyleMap[property.listed_by_user_id] || null;

      const score = propertyMatchScore(property, lifestyle, preferences, seekerMeta, hostLifestyle, hostMeta);
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

  await adminSb.from('compatibility_scores').delete().eq('seeker_id', seekerId);

  console.log(`[Recompute] Seeker ${seekerId}: ${scoreRows.length} total scores computed`);
  if (scoreRows.length > 0) {
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
      offering_type, listed_by_user_id, approval_status, is_active,
      users!listed_by_user_id (date_of_birth, gender)
    `)
    .eq('id', propertyId)
    .single();

  if (!property) return { updated: 0 };
  if (!isEligiblePropertyForMatching(property)) {
    await adminSb.from('compatibility_scores').delete().eq('property_id', propertyId);
    return { updated: 0, reason: 'ineligible_property' };
  }

  const hostMeta = Array.isArray(property.users) ? property.users[0] : property.users || {};
  const { data: hostLifestyleRows } = await adminSb
    .from('user_lifestyles')
    .select('user_id, cleanliness_level, overnight_guests, occupation, smoking_status, pets, schedule_type, social_level, noise_tolerance, interests')
    .eq('user_id', property.listed_by_user_id)
    .limit(1);
  const hostLifestyle = Array.isArray(hostLifestyleRows) ? hostLifestyleRows[0] : hostLifestyleRows || null;

  const [lifestyleIds, preferenceIds] = await Promise.all([
    fetchPagedRows((offset, pageSize) =>
      adminSb
        .from('user_lifestyles')
        .select('user_id')
        .neq('user_id', property.listed_by_user_id)
        .order('user_id')
        .range(offset, offset + pageSize - 1)
    ),
    fetchPagedRows((offset, pageSize) =>
      adminSb
        .from('match_preferences')
        .select('user_id')
        .neq('user_id', property.listed_by_user_id)
        .order('user_id')
        .range(offset, offset + pageSize - 1)
    ),
  ]);

  const seekerIds = mergeUniqueUserIds(lifestyleIds, preferenceIds);
  const scoreRows = [];

  for (let offset = 0; offset < seekerIds.length; offset += BATCH_SIZE) {
    const batchSeekerIds = seekerIds.slice(offset, offset + BATCH_SIZE);
    if (!batchSeekerIds.length) continue;

    const [{ data: lifestyleRows, error: lifestylesError }, prefsResult, userMetaResult] = await Promise.all([
      adminSb
        .from('user_lifestyles')
        .select(`
          user_id,
          cleanliness_level, schedule_type, smoking_status, social_level,
          noise_tolerance, pets, interests, occupation, current_city,
          preferred_room_types, preferred_property_types, move_in_urgency, min_stay, max_stay
        `)
        .in('user_id', batchSeekerIds),
      adminSb
        .from('match_preferences')
        .select(`
          user_id,
          budget_min, budget_max, location_areas, gender_preference,
          accepted_smoking, accepted_pets, stay_duration_min, stay_duration_max,
          move_in_window, occupation_preference, cleanliness_tolerance, guests_tolerance,
          age_min, age_max
        `)
        .in('user_id', batchSeekerIds),
      adminSb
        .from('users')
        .select('id, date_of_birth, gender')
        .in('id', batchSeekerIds),
    ]);

    if (lifestylesError) throw lifestylesError;

    const lifestyleByUserId = Object.fromEntries((lifestyleRows || []).map((lifestyleRow) => [lifestyleRow.user_id, lifestyleRow]));
    const prefsByUserId = Object.fromEntries((prefsResult.data || []).map((pref) => [pref.user_id, pref]));
    const userMetaById = Object.fromEntries((userMetaResult.data || []).map((user) => [user.id, user]));

    for (const seekerId of batchSeekerIds) {
      const prefs = prefsByUserId[seekerId] || null;
      const userMeta = userMetaById[seekerId] || {};
      const lifestyle = buildSeekerLifestyle(lifestyleByUserId[seekerId], userMeta);

      if (!hasMatchingProfile({ lifestyle, preferences: prefs })) continue;

      const score = propertyMatchScore(property, lifestyle, prefs, userMeta, hostLifestyle, hostMeta);
      if (score !== null) {
        scoreRows.push({
          seeker_id: seekerId,
          property_id: propertyId,
          score,
          computed_at: new Date().toISOString(),
        });
      }
    }
  }

  await adminSb.from('compatibility_scores').delete().eq('property_id', propertyId);

  if (scoreRows.length > 0) {
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
