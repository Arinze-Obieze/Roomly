import { propertyMatchScore } from '@/lib/matching/propertyMatchScore';

const BATCH_SIZE = 50;

export async function recomputeForSeeker(adminSb, seekerId) {
  const [lifestyleResult, prefsResult, userResult] = await Promise.all([
    adminSb.from('user_lifestyles').select('*').eq('user_id', seekerId).single(),
    adminSb.from('match_preferences').select('*').eq('user_id', seekerId).single(),
    adminSb.from('users').select('gender, date_of_birth, occupation').eq('id', seekerId).single(),
  ]);

  const lifestyle = lifestyleResult.data;
  const preferences = prefsResult.data;
  const seekerMeta = userResult.data || {};

  let offset = 0;
  let hasMore = true;
  const scoreRows = [];

  while (hasMore) {
    const { data: properties } = await adminSb
      .from('properties')
      .select(`
        id, city, state, price_per_month, gender_preference, occupation_preference,
        age_min, age_max, lifestyle_priorities, deal_breakers, min_stay_months,
        bills_option, couples_allowed, available_from, is_immediate, privacy_setting, is_public
      `)
      .eq('is_active', true)
      .neq('listed_by_user_id', seekerId)
      .range(offset, offset + BATCH_SIZE - 1);

    if (!properties || properties.length === 0) {
      hasMore = false;
      break;
    }

    for (const property of properties) {
      const score = propertyMatchScore(property, lifestyle, preferences, seekerMeta);
      scoreRows.push({
        seeker_id: seekerId,
        property_id: property.id,
        score,
        computed_at: new Date().toISOString(),
      });
    }

    offset += BATCH_SIZE;
    if (properties.length < BATCH_SIZE) hasMore = false;
  }

  if (scoreRows.length > 0) {
    await adminSb
      .from('compatibility_scores')
      .upsert(scoreRows, { onConflict: 'seeker_id,property_id' });
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
      listed_by_user_id
    `)
    .eq('id', propertyId)
    .single();

  if (!property) return { updated: 0 };

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
        preferred_room_types, preferred_property_types, move_in_urgency, min_stay, max_stay,
        match_preferences!inner (
          budget_min, budget_max, location_areas, gender_preference,
          accepted_smoking, accepted_pets, stay_duration_min, stay_duration_max,
          move_in_window, occupation_preference, cleanliness_tolerance, guests_tolerance,
          age_min, age_max
        ),
        users!user_id (gender, date_of_birth, occupation)
      `)
      .neq('user_id', property.listed_by_user_id)
      .range(offset, offset + BATCH_SIZE - 1);

    if (!seekers || seekers.length === 0) {
      hasMore = false;
      break;
    }

    for (const seeker of seekers) {
      const prefs = Array.isArray(seeker.match_preferences)
        ? seeker.match_preferences[0]
        : seeker.match_preferences;
      const userMeta = Array.isArray(seeker.users) ? seeker.users[0] : seeker.users || {};

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

      const score = propertyMatchScore(property, lifestyle, prefs, userMeta);
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
    await adminSb
      .from('compatibility_scores')
      .upsert(scoreRows, { onConflict: 'seeker_id,property_id' });
  }

  return { updated: scoreRows.length };
}
