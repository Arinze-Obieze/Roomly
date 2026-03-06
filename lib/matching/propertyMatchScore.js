/**
 * propertyMatchScore.js
 * 
 * Pure, deterministic, server-side matching algorithm.
 * Produces a 0–100 compatibility score between a property and a seeker.
 * 
 * Data sources:
 *   - property: row from `properties` table (45 cols)
 *   - lifestyle: row from `user_lifestyles` table (22 cols)
 *   - preferences: row from `match_preferences` table (17 cols)
 * 
 * Designed to be called offline (on profile/listing save),
 * with the result stored in `compatibility_scores` for fast feed queries.
 * Never call this synchronously per-request in production at scale.
 */

// Weight table — total = 100
const WEIGHTS = {
  budget:       25,  // Does the listing price fit the seeker's budget?
  location:     20,  // Does the listing location match seeker's preferred areas?
  lifestyle:    15,  // Do lifestyle traits (cleanliness, noise, etc.) align?
  restrictions: 15,  // Does the seeker meet property hard preferences (age, gender, occupation)?
  stayDuration: 10,  // Is the stay duration compatible?
  lifestyle2:   10,  // Secondary lifestyle traits (smoking, pets, guests)
  movein:        5,  // Is the move-in date compatible?
};

/**
 * @param {object} property - Row from `properties` table
 * @param {object} lifestyle - Row from `user_lifestyles` table (can be null)
 * @param {object} preferences - Row from `match_preferences` table (can be null)
 * @param {object} seekerMeta - { gender, date_of_birth, occupation } from `users` table
 * @returns {number} Score between 0 and 100 (integer)
 */
export function propertyMatchScore(property, lifestyle, preferences, seekerMeta = {}) {
  // If we have no lifestyle or preference data, return a neutral score  
  if (!lifestyle && !preferences) return 50;

  // --- HARD FILTERS (deal-breakers) → return 0 immediately ---
  const dealBreakers = normalizeDealBreakers(property.deal_breakers);

  // Smoking
  if (dealBreakers.includes('smoking') && lifestyle?.smoking_status !== 'no') {
    return 0;
  }

  // Pets
  if (dealBreakers.includes('no_pets') && lifestyle?.pets?.has_pets === true) {
    return 0;
  }

  // Budget: seeker's max budget must cover the price
  const seekerMaxBudget = preferences?.budget_max;
  if (seekerMaxBudget && seekerMaxBudget > 0 && property.price_per_month > seekerMaxBudget) {
    return 0;
  }

  // Gender preference
  const propGenderPref = property.gender_preference;
  const seekerGender = seekerMeta.gender;
  if (propGenderPref && propGenderPref !== 'any' && seekerGender && seekerGender !== propGenderPref) {
    return 0;
  }

  // Occupation preference
  const propOccupation = property.occupation_preference;
  const seekerOccupation = lifestyle?.occupation || seekerMeta.occupation;
  if (propOccupation && propOccupation !== 'any' && seekerOccupation) {
    const occMap = { student: 'student', professional: 'professional', working: 'professional' };
    const normSeeker = occMap[seekerOccupation?.toLowerCase()] || seekerOccupation;
    if (normSeeker !== propOccupation) return 0;
  }

  // Age range
  const seekerAge = ageFromDOB(seekerMeta.date_of_birth);
  if (seekerAge !== null) {
    if (property.age_min && seekerAge < property.age_min) return 0;
    if (property.age_max && property.age_max < 99 && seekerAge > property.age_max) return 0;
  }

  // --- SOFT SCORING ---
  let totalScore = 0;

  // 1. Budget fit (25pts)
  totalScore += scoreBudget(property.price_per_month, preferences);

  // 2. Location match (20pts)
  totalScore += scoreLocation(property, lifestyle, preferences);

  // 3. Lifestyle compatibility (15pts) — cleanliness, noise, social via listing.lifestyle_priorities
  totalScore += scoreLifestyle(property.lifestyle_priorities, lifestyle);

  // 4. Restriction alignment (15pts) — gender, occupation, age already passed hard filter; score quality
  totalScore += scoreRestrictions(property, lifestyle, preferences, seekerMeta, seekerAge);

  // 5. Stay duration (10pts)
  totalScore += scoreStayDuration(property.min_stay_months, preferences);

  // 6. Secondary lifestyle (10pts) — smoking acceptance, pet acceptance
  totalScore += scoreSecondaryLifestyle(property, lifestyle, preferences);

  // 7. Move-in compatibility (5pts)
  totalScore += scoreMoveIn(property, preferences);

  return Math.min(100, Math.max(0, Math.round(totalScore)));
}

// ─── Section Scorers ───────────────────────────────────────────────────────────

function scoreBudget(price, preferences) {
  if (!price || !preferences) return WEIGHTS.budget * 0.5; // neutral
  const budgetMin = Number(preferences?.budget_min || 0);
  const budgetMax = Number(preferences?.budget_max || 0);
  if (!budgetMax || budgetMax <= 0) return WEIGHTS.budget * 0.7; // no preference set → partial credit
  if (price > budgetMax) return 0; // already caught in hard filter but safety net
  if (price < budgetMin) return WEIGHTS.budget * 0.6; // below min is fine, slightly less ideal
  // Perfect fit = price is ≤80% of budget_max (comfortable headroom)
  const headroomRatio = (budgetMax - price) / budgetMax;
  const fitScore = Math.min(1, headroomRatio * 2.5 + 0.5);
  return WEIGHTS.budget * fitScore;
}

function scoreLocation(property, lifestyle, preferences) {
  const propCity = property.city?.toLowerCase().trim();
  const propState = property.state?.toLowerCase().trim();

  const seekerAreas = [
    ...(preferences?.location_areas || []),
    lifestyle?.current_city ? [lifestyle.current_city] : [],
  ].flat().map(a => a?.toLowerCase().trim()).filter(Boolean);

  if (!seekerAreas.length) return WEIGHTS.location * 0.5; // no preference → neutral

  const exactMatch = seekerAreas.some(a => a === propCity);
  if (exactMatch) return WEIGHTS.location;

  const stateMatch = seekerAreas.some(a => a === propState || propCity?.includes(a) || a.includes(propCity));
  if (stateMatch) return WEIGHTS.location * 0.6;

  return 0;
}

function scoreLifestyle(lifestylePriorities, lifestyle) {
  if (!lifestylePriorities || typeof lifestylePriorities !== 'object' || !lifestyle) {
    return WEIGHTS.lifestyle * 0.5;
  }

  const normalizedPriorities = normalizeLifestylePriorities(lifestylePriorities);

  // Map property priorities to lifestyle fields
  // lifestyle_priorities = { cleanliness: "must_match" | "nice_to_have" | "not_important", ... }
  const FACTOR_MAP = {
    cleanliness: { field: 'cleanliness_level', ideal: 4, tolerance: 1.5 },
    noise:       { field: 'noise_tolerance',   ideal: 3, tolerance: 2 },
    social:      { field: 'social_level',       ideal: 3, tolerance: 2 },
  };

  const PRIORITY_WEIGHT = { must_match: 1.0, nice_to_have: 0.5, not_important: 0.1 };

  let weightedScore = 0;
  let totalWeight = 0;

  for (const [factor, mapping] of Object.entries(FACTOR_MAP)) {
    const priority = normalizedPriorities[factor];
    const pw = PRIORITY_WEIGHT[priority] ?? 0.1;
    totalWeight += pw;

    const seekerVal = lifestyle[mapping.field];
    if (seekerVal != null) {
      const diff = Math.abs(seekerVal - mapping.ideal);
      const factorScore = Math.max(0, 1 - diff / mapping.tolerance);
      weightedScore += factorScore * pw;
    } else {
      weightedScore += 0.5 * pw; // neutral if unknown
    }
  }

  if (totalWeight === 0) return WEIGHTS.lifestyle * 0.5;
  return WEIGHTS.lifestyle * (weightedScore / totalWeight);
}

function scoreRestrictions(property, lifestyle, preferences, seekerMeta, seekerAge) {
  let score = WEIGHTS.restrictions;
  
  // If hard filters passed, score based on HOW well we fit (not just pass/fail)
  // Gender: if 'any', full marks; if specific and matches, full marks
  const propGender = property.gender_preference;
  const seekerGender = seekerMeta?.gender;
  if (!propGender || propGender === 'any' || !seekerGender) {
    // full marks — no restriction or unknown
  } else if (propGender === seekerGender) {
    score *= 1.0;
  }

  // Age: bonus if comfortably in the middle of the age range
  if (seekerAge !== null && property.age_min && property.age_max) {
    const rangeWidth = property.age_max - property.age_min;
    if (rangeWidth > 0) {
      const centeredness = 1 - (2 * Math.abs(seekerAge - (property.age_min + property.age_max) / 2) / rangeWidth);
      score *= Math.max(0.6, Math.min(1, centeredness));
    }
  }

  return score;
}

function scoreStayDuration(minStayMonths, preferences) {
  if (!minStayMonths || !preferences) return WEIGHTS.stayDuration * 0.6;
  const stayDurationMin = Number(
    preferences?.stay_duration_min ?? preferences?.min_stay ?? 0
  );
  const stayDurationMaxRaw = preferences?.stay_duration_max ?? preferences?.max_stay;
  const stayDurationMax = stayDurationMaxRaw == null ? null : Number(stayDurationMaxRaw);

  // Seeker must be willing to stay at least as long as minStayMonths
  if (stayDurationMax && stayDurationMax < minStayMonths) return 0;
  if (stayDurationMin >= minStayMonths) return WEIGHTS.stayDuration;
  // Partial: seeker might be flexible
  return WEIGHTS.stayDuration * 0.6;
}

function scoreSecondaryLifestyle(property, lifestyle, preferences) {
  if (!lifestyle) return WEIGHTS.lifestyle2 * 0.5;
  let points = 0;
  const max = WEIGHTS.lifestyle2;

  // Smoking (40% of secondary score)
  const acceptedSmoking = preferences?.accepted_smoking || [];
  const propDeal = normalizeDealBreakers(property.deal_breakers);
  if (lifestyle.smoking_status === 'no' || acceptedSmoking.includes(lifestyle.smoking_status)) {
    points += max * 0.4;
  } else if (!propDeal.includes('smoking')) {
    points += max * 0.2;
  }

  // Pets (40% of secondary score)
  const seekerHasPets = lifestyle.pets?.has_pets;
  const propAcceptsPets = !propDeal.includes('no_pets');
  if (!seekerHasPets || propAcceptsPets) {
    points += max * 0.4;
  }

  // Dietary / guests neutral factor (20%)
  points += max * 0.2;

  return points;
}

function scoreMoveIn(property, preferences) {
  if (!property.available_from || !preferences?.move_in_window) {
    return WEIGHTS.movein * 0.5;
  }
  const propDate = new Date(property.available_from);
  const diffDaysFromToday = (propDate - new Date()) / (1000 * 60 * 60 * 24);
  const moveInWindow = String(preferences.move_in_window).toLowerCase().trim();
  
  if (property.is_immediate) return WEIGHTS.movein; // immediate always good

  // Enum-based move-in preferences (shape used in match_preferences)
  if (moveInWindow === 'immediately') {
    if (diffDaysFromToday <= 7) return WEIGHTS.movein;
    if (diffDaysFromToday <= 21) return WEIGHTS.movein * 0.7;
    return WEIGHTS.movein * 0.3;
  }
  if (moveInWindow === '1-month') {
    if (diffDaysFromToday <= 30) return WEIGHTS.movein;
    if (diffDaysFromToday <= 45) return WEIGHTS.movein * 0.7;
    return WEIGHTS.movein * 0.4;
  }
  if (moveInWindow === '2-months') {
    if (diffDaysFromToday <= 60) return WEIGHTS.movein;
    if (diffDaysFromToday <= 90) return WEIGHTS.movein * 0.7;
    return WEIGHTS.movein * 0.4;
  }
  if (moveInWindow === 'flexible') {
    return WEIGHTS.movein * 0.8;
  }

  // Backward compatibility for old date-based format
  const windowDate = new Date(preferences.move_in_window);
  if (!Number.isNaN(windowDate.getTime())) {
    const diffDays = (propDate - windowDate) / (1000 * 60 * 60 * 24);
    if (Math.abs(diffDays) <= 14) return WEIGHTS.movein;
    if (Math.abs(diffDays) <= 60) return WEIGHTS.movein * 0.7;
    if (diffDays < 0) return WEIGHTS.movein * 0.3;
  }

  return WEIGHTS.movein * 0.5;
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function ageFromDOB(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return isNaN(age) ? null : age;
}

function normalizeDealBreakers(rawDealBreakers) {
  const source = Array.isArray(rawDealBreakers) ? rawDealBreakers : [];
  const normalized = new Set(source.map((value) => String(value || '').toLowerCase().trim()));

  // Normalize historical/legacy IDs to scorer IDs
  if (normalized.has('smokers')) normalized.add('smoking');
  if (normalized.has('pets')) normalized.add('no_pets');
  if (normalized.has('no-pets')) normalized.add('no_pets');
  if (normalized.has('no_pets')) normalized.add('no_pets');

  return [...normalized];
}

function normalizeLifestylePriorities(priorities) {
  const source = priorities && typeof priorities === 'object' ? priorities : {};
  return {
    cleanliness: source.cleanliness ?? source.clean ?? 'not_important',
    social: source.social ?? source.socializing ?? 'not_important',
    noise: source.noise ?? source.quiet ?? source.sleep ?? 'not_important',
  };
}
