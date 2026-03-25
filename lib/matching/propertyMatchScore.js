/**
 * propertyMatchScore.js
 * 
 * Pure, deterministic, server-side matching algorithm.
 * Produces a 0–100 compatibility score between a property and a seeker.
 * 
 * Data sources:
 *   - property: row from `properties` table
 *   - seekerLifestyle: row from `user_lifestyles` table
 *   - seekerPrefs: row from `match_preferences` table
 *   - seekerMeta: { gender, date_of_birth, occupation } from `users` table
 *   - hostLifestyle: row from `user_lifestyles` table (belonging to host)
 *   - hostMeta: { gender, age, occupation } from `users` table (belonging to host)
 */

// Dynamic Weights based on Context (Shared Space vs Entire Place)
const WEIGHTS = {
  SHARED_SPACE: {
    budget:       20,  // Does it fit the budget?
    location:     15,  // Is it in the right area?
    propertyFit:  15,  // Does the property allow the seeker's pets/smoking/stay duration?
    hostHarmony:  35,  // Do the personal lifestyles (cleanliness, noise, social, age/gender) match?
    movein:       15,  // Is the move-in timeline compatible?
  },
  ENTIRE_PLACE: {
    budget:       40,  // Budget is vastly more important for entire places
    location:     25,  // Location is key
    propertyFit:  25,  // Restrictions (pets/smoking/occupation) set by landlord
    hostHarmony:   0,  // Irrelevant: The landlord doesn't live there
    movein:       10,  // Move in timeline
  }
};

/**
 * @returns {number} Score between 0 and 100 (integer)
 */
export function propertyMatchScore(
  property, 
  seekerLifestyle, 
  seekerPrefs, 
  seekerMeta = {}, 
  hostLifestyle = null, 
  hostMeta = {}
) {
  // If we have no seeker profile data, we can't reliably score. Return null so UI prompts them to fill it out.
  if (!seekerLifestyle && !seekerPrefs) return null;

  // Determine Context: Shared Space (private_room, shared_room) vs Entire Place (whole_place)
  const isSharedSpace = property?.offering_type === 'private_room' || property?.offering_type === 'shared_room';
  const w = isSharedSpace ? WEIGHTS.SHARED_SPACE : WEIGHTS.ENTIRE_PLACE;

  // --- HARD FILTERS (deal-breakers) → return 0 immediately ---
  const dealBreakers = normalizeDealBreakers(property.deal_breakers);

  // Smoking (Host forbids it, Seeker smokes)
  if (dealBreakers.includes('smoking') && seekerLifestyle?.smoking_status !== 'no') {
    return 0;
  }

  // Pets (Host forbids them, Seeker has them)
  if (dealBreakers.includes('no_pets') && seekerLifestyle?.pets?.has_pets === true) {
    return 0;
  }

  // Minimum Stay (Property strictly requires longer than Seeker can commit)
  const stayMaxRaw = seekerPrefs?.stay_duration_max ?? seekerPrefs?.max_stay;
  const stayMax = stayMaxRaw == null ? null : Number(stayMaxRaw);
  if (stayMax && property.min_stay_months && stayMax < property.min_stay_months) {
    return 0; // Seeker will leave before the minimum stay requirement
  }

  // --- SOFT SCORING ---
  let totalScore = 0;

  // 1. Budget Fit
  totalScore += scoreBudget(property.price_per_month, seekerPrefs, w.budget);

  // 2. Location Match
  totalScore += scoreLocation(property, seekerLifestyle, seekerPrefs, w.location);

  // 3. Property Fit / Restrictions (Gender, Age, Occupation, Stay Duration flexibility)
  totalScore += scorePropertyFit(property, seekerLifestyle, seekerPrefs, seekerMeta, w.propertyFit);

  // 4. Host Harmony (Only applicable for Shared Spaces. Compares Seeker's "Ideal Roommate" to actual Host profile)
  if (isSharedSpace && w.hostHarmony > 0) {
    totalScore += scoreHostHarmony(property, seekerLifestyle, seekerPrefs, hostLifestyle, hostMeta, w.hostHarmony);
  }

  // 5. Move-in compatibility
  totalScore += scoreMoveIn(property, seekerPrefs, w.movein);

  return Math.min(100, Math.max(0, Math.round(totalScore)));
}

export function propertyMatchConfidence(
  property,
  seekerLifestyle,
  seekerPrefs,
  seekerMeta = {},
  hostLifestyle = null,
  hostMeta = {}
) {
  if (!seekerLifestyle && !seekerPrefs) return 0;

  const isSharedSpace = property?.offering_type === 'private_room' || property?.offering_type === 'shared_room';
  let availableSignals = 0;

  if (seekerLifestyle) availableSignals += 3;
  if (seekerPrefs) availableSignals += 3;
  if (seekerMeta?.gender || seekerMeta?.date_of_birth || seekerMeta?.occupation) availableSignals += 1;

  if (isSharedSpace) {
    if (hostLifestyle) availableSignals += 2;
    if (hostMeta?.gender || hostMeta?.date_of_birth || hostMeta?.occupation) availableSignals += 1;
  }

  const maxSignals = isSharedSpace ? 10 : 7;
  return Math.round((availableSignals / maxSignals) * 100);
}

// ─── Section Scorers ───────────────────────────────────────────────────────────

function scoreBudget(price, preferences, weight) {
  if (!price || !preferences || weight === 0) return weight * 0.5; // neutral

  const budgetMin = Number(preferences?.budget_min || 0);
  const budgetMax = Number(preferences?.budget_max || 0);
  
  if (!budgetMax || budgetMax <= 0) return weight * 0.7; // no preference set → partial credit
  
  // Softened Dealbreaker: If price is > max budget, it's not an instant 0 anymore, but a heavy penalty.
  if (price > budgetMax) {
      const overagePercent = (price - budgetMax) / budgetMax;
      // If > 20% over budget, 0 points. Otherwise, some decay points.
      if (overagePercent > 0.20) return 0; 
      return weight * Math.max(0, 0.4 - (overagePercent * 2)); 
  }

  if (price < budgetMin) return weight * 0.8; // below min is fine, slightly less ideal
  
  // Perfect fit = price is significantly below budget_max.
  // At exactly budget_max, score is 0.85 (it's exactly what they planned for).
  const headroomRatio = (budgetMax - price) / budgetMax;
  const fitScore = Math.min(1, headroomRatio * 1.5 + 0.85);
  return weight * fitScore;
}

function scoreLocation(property, lifestyle, preferences, weight) {
  if (weight === 0) return 0;
  const propCity = property.city?.toLowerCase().trim();
  const propState = property.state?.toLowerCase().trim();

  const seekerAreas = [
    ...(preferences?.location_areas || []),
    lifestyle?.current_city ? [lifestyle.current_city] : [],
  ].flat().map(a => a?.toLowerCase().trim()).filter(Boolean);

  if (!seekerAreas.length) return weight * 0.5; // no preference → neutral

  const exactMatch = seekerAreas.some(a => a === propCity);
  if (exactMatch) return weight;

  const stateMatch = seekerAreas.some(a => a === propState || propCity?.includes(a) || a.includes(propCity));
  if (stateMatch) return weight * 0.6;

  return 0;
}

function scorePropertyFit(property, seekerLifestyle, seekerPrefs, seekerMeta, weight) {
  if (weight === 0) return 0;
  
  // Evaluates how well the SEEKER matches the PROPERTY'S rules. 
  // It checks Gender, Age, Occupation, and Stay Duration buffers.
  
  let scorePoints = weight;
  let multipliers = [];

  // 1. Gender Restriction
  const propGender = property.gender_preference;
  const seekerGender = seekerMeta?.gender;
  if (!propGender || propGender === 'any' || !seekerGender) {
    multipliers.push(1.0);
  } else if (propGender === seekerGender) {
    multipliers.push(1.0);
  } else {
    multipliers.push(0.0); // Completely wrong gender
  }

  // 2. Age Restriction
  const seekerAge = ageFromDOB(seekerMeta?.date_of_birth);
  if (seekerAge !== null && property.age_min && property.age_max) {
    const rangeWidth = property.age_max - property.age_min;
    if (rangeWidth > 0 && seekerAge >= property.age_min && seekerAge <= property.age_max) {
      // Bonus if comfortably in the middle, sligthly lower if riding the edge
      const centeredness = 1 - (2 * Math.abs(seekerAge - (property.age_min + property.age_max) / 2) / rangeWidth);
      multipliers.push(Math.max(0.85, Math.min(1, centeredness)));
    } else if (seekerAge < property.age_min || seekerAge > property.age_max) {
      multipliers.push(0.0); // Outside age boundary
    }
  } else {
      multipliers.push(1.0); // No age data to judge
  }

  // 3. Occupation Preference
  const propOccupation = property.occupation_preference;
  const seekerOccupation = seekerLifestyle?.occupation || seekerMeta?.occupation;
  if (propOccupation && propOccupation !== 'any' && seekerOccupation) {
    const occMap = { student: 'student', professional: 'professional', working: 'professional' };
    const normSeeker = occMap[seekerOccupation?.toLowerCase()] || seekerOccupation;
    if (normSeeker !== propOccupation) {
        multipliers.push(0.2); // Not a hard zero, but a strong penalty 
    } else {
        multipliers.push(1.0);
    }
  } else {
      multipliers.push(1.0);
  }

  // 4. Stay Duration Buffer
  // The Dealbreaker caught if max_stay is < property min_stay. But we reward them if min_stay fits comfortably.
  const stayDurationMin = Number(seekerPrefs?.stay_duration_min ?? seekerPrefs?.min_stay ?? 0);
  const minStayMonths = property.min_stay_months;
  if (minStayMonths) {
      if (stayDurationMin >= minStayMonths) {
          multipliers.push(1.0); // Perfect, they want to stay at least the minimum
      } else {
          multipliers.push(0.7); // Borderline: their min_stay is shorter, but their max_stay passed the dealbreaker
      }
  }

  // Average all the multipliers and apply to the weight
  const finalMultiplier = multipliers.length > 0 
    ? multipliers.reduce((a, b) => a + b, 0) / multipliers.length 
    : 1.0;

  return scorePoints * finalMultiplier;
}

function scoreHostHarmony(property, seekerLifestyle, seekerPrefs, hostLifestyle, hostMeta, weight) {
  if (weight === 0) return 0;
  
  // Evaluates how well the HOST and PROPERTY match the SEEKER'S "Ideal Roommate" preferences.
  // This is the true bidirectional magic for shared spaces.
  
  if (!hostLifestyle) return weight * 0.5; // Unknown host profile, give neutral credit

  const priorities = normalizeLifestylePriorities(property?.lifestyle_priorities);
  let maxPoints = weight;
  let earnedPoints = 0;

  // 1. Cleanliness (Does host meet seeker's minimum standard?)
  // `cleanliness_tolerance`: 'relaxed' = 1, 'moderate' = 2, 'high' = 3
  const hostCleanliness = hostLifestyle.cleanliness_level || 2; 
  const seekerCleanlinessReq = seekerPrefs?.cleanliness_tolerance;
  const cleanReqScore = { 'relaxed': 1, 'moderate': 2, 'high': 3 }[seekerCleanlinessReq] || 0;
  
  let cleanPoints = maxPoints * 0.2; // 20% of harmony points
  if (cleanReqScore > 0) {
      if (hostCleanliness >= cleanReqScore) earnedPoints += cleanPoints; // Complete pass
      else earnedPoints += (cleanPoints * getCleanlinessFallbackMultiplier(priorities.cleanliness)); // Host is messier than preferred (Penalty)
  } else {
      earnedPoints += cleanPoints; // Seeker didn't care
  }

  // 2. Overnight Guests (Does host respect seeker's guest boundaries?)
  // `guests_tolerance`: 'never'=1, 'rarely'=2, 'occasionally'=3, 'any'=4
  const hostGuests = hostLifestyle.overnight_guests || 'occasionally';
  const seekerGuestsTol = seekerPrefs?.guests_tolerance;
  const guestHostScore = { 'never': 1, 'rarely': 2, 'occasionally': 3, 'frequently': 4 }[hostGuests];
  const guestReqScore = { 'never': 1, 'rarely': 2, 'occasionally': 3, 'any': 4 }[seekerGuestsTol] || 4; // default 'any'
  
  let guestPoints = maxPoints * 0.15; // 15% of harmony points
  if (guestHostScore <= guestReqScore) {
      earnedPoints += guestPoints;
  } else {
      earnedPoints += (guestPoints * 0.4); // Host has guests more often than preferred
  }

  // 3. Demographics (Does the Host fit the Seeker's requested Age/Gender/Occupation?)
  let demoPoints = maxPoints * 0.2; // 20% of harmony points
  let demoMatches = [];
  
  // Host Gender vs Seeker Preference
  if (seekerPrefs?.gender_preference && seekerPrefs.gender_preference !== 'any') {
      demoMatches.push(hostMeta?.gender === seekerPrefs.gender_preference ? 1.0 : 0.0);
  } else demoMatches.push(1.0);

  // Host Age vs Seeker Preference
  const hostAge = ageFromDOB(hostMeta?.date_of_birth);
  if (seekerPrefs?.age_min && seekerPrefs?.age_max && hostAge) {
      if (hostAge >= seekerPrefs.age_min && hostAge <= seekerPrefs.age_max) demoMatches.push(1.0);
      else demoMatches.push(0.3); // Age miss is a slight penalty, not a hard zero
  } else demoMatches.push(1.0);

  // Host Occupation vs Seeker Preference
  const seekerOccPref = seekerPrefs?.occupation_preference || [];
  const hostOcc = hostLifestyle.occupation || hostMeta?.occupation;
  if (seekerOccPref.length > 0 && hostOcc) {
      const occMap = { student: 'Student', professional: 'Professional', working: 'Professional', unemployed: 'Unemployed' };
      const normHost = occMap[hostOcc.toLowerCase()] || hostOcc;
      demoMatches.push(seekerOccPref.includes(normHost) ? 1.0 : 0.4);
  } else demoMatches.push(1.0);

  earnedPoints += demoPoints * (demoMatches.reduce((a, b) => a + b, 0) / demoMatches.length);

  // 4. Secondary Lifestyle Friction (Smoking/Pets)
  let frictionPoints = maxPoints * 0.15; 
  let fPoints = 0;

  const hostSmokes = normalizeSmokingStatus(hostLifestyle?.smoking_status) === 'yes';
  const seekerSmokes = normalizeSmokingStatus(seekerLifestyle?.smoking_status) === 'yes';
  const seekerAcceptsSmoking = normalizeSmokingTolerance(seekerPrefs?.accepted_smoking);

  if (!hostSmokes) {
    fPoints += frictionPoints * 0.5;
  } else if (seekerAcceptsSmoking || seekerSmokes) {
    fPoints += frictionPoints * 0.35;
  } else {
    fPoints += frictionPoints * 0.05;
  }

  const hostHasPets = hasPets(hostLifestyle?.pets);
  const seekerHasPets = hasPets(seekerLifestyle?.pets);
  const seekerAcceptsPets = !!seekerPrefs?.accepted_pets;

  if (!hostHasPets) {
    fPoints += frictionPoints * 0.3;
  } else if (seekerAcceptsPets || seekerHasPets) {
    fPoints += frictionPoints * 0.3;
  } else {
    fPoints += frictionPoints * 0.05;
  }
  
  earnedPoints += fPoints;

  // 5. Lifestyle alignment (schedule, social energy, noise, shared interests)
  const vibePoints = maxPoints * 0.3;
  earnedPoints += vibePoints * scoreLifestyleAlignment(seekerLifestyle, hostLifestyle, priorities);

  return earnedPoints;
}

function scoreMoveIn(property, preferences, weight) {
  if (weight === 0) return 0;
  if (!property.available_from || !preferences?.move_in_window) {
    return weight * 0.5;
  }
  const propDate = new Date(property.available_from);
  const diffDaysFromToday = (propDate - new Date()) / (1000 * 60 * 60 * 24);
  const moveInWindow = String(preferences.move_in_window).toLowerCase().trim();
  
  if (property.is_immediate) return weight; // immediate always good

  // Enum-based move-in preferences (shape used in match_preferences)
  if (moveInWindow === 'immediately') {
    if (diffDaysFromToday <= 7) return weight;
    if (diffDaysFromToday <= 21) return weight * 0.7;
    return weight * 0.3;
  }
  if (moveInWindow === '1-month') {
    if (diffDaysFromToday <= 30) return weight;
    if (diffDaysFromToday <= 45) return weight * 0.7;
    return weight * 0.4;
  }
  if (moveInWindow === '2-months') {
    if (diffDaysFromToday <= 60) return weight;
    if (diffDaysFromToday <= 90) return weight * 0.7;
    return weight * 0.4;
  }
  if (moveInWindow === 'flexible') {
    return weight * 0.8;
  }

  // Backward compatibility for old date-based format
  const windowDate = new Date(preferences.move_in_window);
  if (!Number.isNaN(windowDate.getTime())) {
    const diffDays = (propDate - windowDate) / (1000 * 60 * 60 * 24);
    if (Math.abs(diffDays) <= 14) return weight;
    if (Math.abs(diffDays) <= 60) return weight * 0.7;
    if (diffDays < 0) return weight * 0.3;
  }

  return weight * 0.5;
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

function normalizeSmokingStatus(value) {
  const normalized = String(value || '').toLowerCase().trim();
  if (['yes', 'smoker', 'sometimes', 'occasionally'].includes(normalized)) return 'yes';
  if (['no', 'non-smoker', 'nonsmoker', 'never'].includes(normalized)) return 'no';
  return 'unknown';
}

function normalizeSmokingTolerance(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'boolean') return value;

  const normalized = String(value || '').toLowerCase().trim();
  return ['yes', 'allowed', 'ok', 'true', 'sometimes', 'occasionally'].includes(normalized);
}

function hasPets(value) {
  if (value?.has_pets === true) return true;
  if (Array.isArray(value?.types) && value.types.length > 0) return true;
  if (typeof value === 'boolean') return value;
  return false;
}

function getCleanlinessFallbackMultiplier(priority) {
  const normalized = normalizePriority(priority);
  if (normalized === 'very_important') return 0.15;
  if (normalized === 'important') return 0.22;
  return 0.3;
}

function scoreLifestyleAlignment(seekerLifestyle, hostLifestyle, priorities) {
  const weights = {
    schedule: 0.28,
    social: 0.24,
    noise: 0.24,
    interests: 0.24,
  };

  let score = 0;
  score += weights.schedule * scoreScheduleCompatibility(
    seekerLifestyle?.schedule_type,
    hostLifestyle?.schedule_type
  );
  score += weights.social * scoreLevelCompatibility(
    seekerLifestyle?.social_level,
    hostLifestyle?.social_level,
    priorities.social
  );
  score += weights.noise * scoreLevelCompatibility(
    seekerLifestyle?.noise_tolerance,
    hostLifestyle?.noise_tolerance,
    priorities.noise
  );
  score += weights.interests * scoreInterestOverlap(
    seekerLifestyle?.interests,
    hostLifestyle?.interests
  );

  return Math.max(0, Math.min(1, score));
}

function scoreScheduleCompatibility(seekerSchedule, hostSchedule) {
  const seeker = normalizeScheduleType(seekerSchedule);
  const host = normalizeScheduleType(hostSchedule);

  if (!seeker || !host) return 0.75;
  if (seeker === host) return 1;

  const compatiblePairs = new Set([
    'day:wfh',
    'wfh:day',
    'day:student',
    'student:day',
    'wfh:mixed',
    'mixed:wfh',
    'student:mixed',
    'mixed:student',
    'day:mixed',
    'mixed:day',
  ]);

  if (compatiblePairs.has(`${seeker}:${host}`)) return 0.8;
  if (seeker === 'shift' || host === 'shift') return 0.45;

  return 0.6;
}

function normalizeScheduleType(value) {
  const normalized = String(value || '').toLowerCase().trim();
  const map = {
    '9-5': 'day',
    day: 'day',
    student: 'student',
    shift: 'shift',
    wfh: 'wfh',
    mixed: 'mixed',
  };
  return map[normalized] || null;
}

function scoreLevelCompatibility(seekerValue, hostValue, priority) {
  const seeker = Number(seekerValue);
  const host = Number(hostValue);

  if (!Number.isFinite(seeker) || !Number.isFinite(host)) return 0.75;

  const distance = Math.abs(seeker - host);
  const normalizedPriority = normalizePriority(priority);

  if (distance === 0) return 1;
  if (distance === 1) {
    if (normalizedPriority === 'very_important') return 0.7;
    if (normalizedPriority === 'important') return 0.78;
    return 0.85;
  }

  if (normalizedPriority === 'very_important') return 0.3;
  if (normalizedPriority === 'important') return 0.45;
  return 0.6;
}

function scoreInterestOverlap(seekerInterests, hostInterests) {
  const seeker = normalizeInterestSet(seekerInterests);
  const host = normalizeInterestSet(hostInterests);

  if (seeker.size === 0 || host.size === 0) return 0.7;

  let overlap = 0;
  for (const value of seeker) {
    if (host.has(value)) overlap += 1;
  }

  if (overlap === 0) return 0.35;

  const maxSize = Math.max(seeker.size, host.size);
  return Math.max(0.35, Math.min(1, overlap / maxSize + 0.25));
}

function normalizeInterestSet(values) {
  if (!Array.isArray(values)) return new Set();

  return new Set(
    values
      .map((value) => String(value || '').toLowerCase().trim())
      .filter(Boolean)
  );
}

function normalizePriority(value) {
  const normalized = String(value || '').toLowerCase().trim();
  if (['very_important', 'high', 'critical'].includes(normalized)) return 'very_important';
  if (['important', 'medium'].includes(normalized)) return 'important';
  return 'not_important';
}
