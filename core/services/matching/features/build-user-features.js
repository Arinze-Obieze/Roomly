import { resolveUserProfileVisibility } from '../../users/profile-privacy.js';

function normalizeText(value) {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase().replace(/\s+/g, ' ');
  return normalized || null;
}

function normalizeArray(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => normalizeText(value))
    .filter(Boolean);
}

function resolveAgeYears(dateOfBirth, now = new Date()) {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;

  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birthDate.getUTCMonth();
  const dayDiff = now.getUTCDate() - birthDate.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age >= 0 ? age : null;
}

function resolveProfileCompletionState({ lifestyle, preferences }) {
  const hasLifestyle = !!lifestyle;
  const hasPreferences = !!preferences;
  if (hasLifestyle && hasPreferences) return 'complete';
  if (hasLifestyle || hasPreferences) return 'partial';
  return 'missing';
}

export function buildUserMatchingFeatures({
  user = {},
  lifestyle = null,
  preferences = null,
  now = new Date(),
} = {}) {
  const hasLifestyle = !!lifestyle;
  const hasPreferences = !!preferences;

  return {
    user_id: user?.id || lifestyle?.user_id || preferences?.user_id || null,
    profile_completion_state: resolveProfileCompletionState({ lifestyle, preferences }),
    has_lifestyle: hasLifestyle,
    has_preferences: hasPreferences,
    privacy_setting: resolveUserProfileVisibility(user),
    current_city_normalized: normalizeText(lifestyle?.current_city),
    budget_min: Number.isFinite(Number(preferences?.budget_min)) ? Number(preferences.budget_min) : null,
    budget_max: Number.isFinite(Number(preferences?.budget_max)) ? Number(preferences.budget_max) : null,
    preferred_property_types: normalizeArray(lifestyle?.preferred_property_types),
    interests: normalizeArray(lifestyle?.interests),
    schedule_type: normalizeText(lifestyle?.schedule_type),
    cleanliness_level: Number.isFinite(Number(lifestyle?.cleanliness_level)) ? Number(lifestyle.cleanliness_level) : null,
    social_level: Number.isFinite(Number(lifestyle?.social_level)) ? Number(lifestyle.social_level) : null,
    noise_tolerance: Number.isFinite(Number(lifestyle?.noise_tolerance)) ? Number(lifestyle.noise_tolerance) : null,
    age_years: resolveAgeYears(user?.date_of_birth, now),
    updated_at: now.toISOString(),
  };
}
