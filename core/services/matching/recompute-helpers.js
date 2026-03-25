export function hasMatchingProfile({ lifestyle = null, preferences = null } = {}) {
  return !!(lifestyle || preferences);
}

export function mergeUniqueUserIds(...collections) {
  return [...new Set(
    collections
      .flatMap((rows) => rows || [])
      .map((row) => row?.user_id)
      .filter(Boolean)
  )];
}

export function isEligiblePropertyForMatching(property = {}) {
  return property?.is_active === true && property?.approval_status === 'approved';
}

export function buildSeekerLifestyle(seekerRow = null, userMeta = {}) {
  if (!seekerRow) return null;

  return {
    cleanliness_level: seekerRow.cleanliness_level,
    schedule_type: seekerRow.schedule_type,
    smoking_status: seekerRow.smoking_status,
    social_level: seekerRow.social_level,
    noise_tolerance: seekerRow.noise_tolerance,
    pets: seekerRow.pets,
    interests: seekerRow.interests,
    occupation: seekerRow.occupation || userMeta?.occupation,
    current_city: seekerRow.current_city,
    preferred_room_types: seekerRow.preferred_room_types,
    preferred_property_types: seekerRow.preferred_property_types,
    move_in_urgency: seekerRow.move_in_urgency,
    min_stay: seekerRow.min_stay,
    max_stay: seekerRow.max_stay,
  };
}
