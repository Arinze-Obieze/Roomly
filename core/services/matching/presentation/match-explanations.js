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

function formatScheduleLabel(value) {
  const normalized = normalizeScheduleType(value);
  const labels = {
    day: 'daytime routine',
    student: 'student routine',
    shift: 'shift schedule',
    wfh: 'work-from-home routine',
    mixed: 'flexible routine',
  };
  return labels[normalized] || null;
}

function normalizeInterestSet(values) {
  if (!Array.isArray(values)) return new Set();
  return new Set(
    values
      .map((value) => String(value || '').toLowerCase().trim())
      .filter(Boolean)
  );
}

function titleCase(value) {
  return String(value || '')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function pushUniqueReason(reasons, text) {
  if (!text || reasons.includes(text)) return;
  reasons.push(text);
}

function normalizePreferenceList(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => String(value || '').toLowerCase().trim())
    .filter(Boolean);
}

function buildStableSeed(...parts) {
  return parts
    .map((part) => String(part || '').trim().toLowerCase())
    .filter(Boolean)
    .join('|');
}

function pickVariant(options, seed) {
  if (!Array.isArray(options) || options.length === 0) return null;
  const source = String(seed || '');
  const hash = [...source].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return options[hash % options.length];
}

function pushReasonEntry(entries, category, options, seed) {
  const text = pickVariant(options, `${category}:${seed}`);
  if (!text || entries.some((entry) => entry.text === text)) return;
  entries.push({ category, text });
}

export function buildPropertyMatchReasons({
  property = {},
  seekerLifestyle = null,
  seekerPrefs = null,
  hostLifestyle = null,
  limit = 3,
} = {}) {
  const reasonEntries = [];
  const propertySeed = buildStableSeed(property?.id, property?.title, property?.city, property?.property_type);

  const seekerSchedule = normalizeScheduleType(seekerLifestyle?.schedule_type);
  const hostSchedule = normalizeScheduleType(hostLifestyle?.schedule_type);
  if (seekerSchedule && hostSchedule && seekerSchedule === hostSchedule) {
    const scheduleLabel = formatScheduleLabel(seekerLifestyle?.schedule_type);
    pushReasonEntry(reasonEntries, 'lifestyle', [
      `Aligned ${scheduleLabel}`,
      `Good fit for your ${scheduleLabel}`,
      `Routine lines up with this home`,
    ], `${propertySeed}:schedule:${scheduleLabel}`);
  }

  if (
    Number.isFinite(Number(seekerLifestyle?.noise_tolerance)) &&
    Number.isFinite(Number(hostLifestyle?.noise_tolerance)) &&
    Math.abs(Number(seekerLifestyle.noise_tolerance) - Number(hostLifestyle.noise_tolerance)) <= 1
  ) {
    pushReasonEntry(reasonEntries, 'lifestyle', [
      'Similar noise expectations',
      'Noise level looks compatible',
      'Quiet/lively balance looks right',
    ], `${propertySeed}:noise`);
  }

  if (
    Number.isFinite(Number(seekerLifestyle?.social_level)) &&
    Number.isFinite(Number(hostLifestyle?.social_level)) &&
    Math.abs(Number(seekerLifestyle.social_level) - Number(hostLifestyle.social_level)) <= 1
  ) {
    pushReasonEntry(reasonEntries, 'lifestyle', [
      'Similar social pace',
      'Social energy feels compatible',
      'Shared pace for home life',
    ], `${propertySeed}:social`);
  }

  const seekerInterests = normalizeInterestSet(seekerLifestyle?.interests);
  const hostInterests = normalizeInterestSet(hostLifestyle?.interests);
  const sharedInterests = [...seekerInterests].filter((value) => hostInterests.has(value));
  if (sharedInterests.length > 0) {
    const interestLabel = titleCase(sharedInterests[0]);
    pushReasonEntry(reasonEntries, 'lifestyle', [
      `Shared interests like ${interestLabel}`,
      `Lifestyle overlap around ${interestLabel}`,
      `Common interests like ${interestLabel}`,
    ], `${propertySeed}:interest:${interestLabel}`);
  }

  const preferredPropertyTypes = normalizePreferenceList(seekerLifestyle?.preferred_property_types);
  const propertyType = String(property.property_type || '').toLowerCase().trim();
  if (propertyType && preferredPropertyTypes.includes(propertyType)) {
    const propertyTypeLabel = titleCase(propertyType);
    pushReasonEntry(reasonEntries, 'setup', [
      `Matches your preferred ${propertyTypeLabel} setup`,
      `${propertyTypeLabel} fits what you usually look for`,
      `Property type matches your preference`,
    ], `${propertySeed}:property-type:${propertyTypeLabel}`);
  }

  if (property.offering_type === 'whole_place') {
    pushReasonEntry(reasonEntries, 'setup', [
      'More independent living setup',
      'Strong fit for more private living',
      'Good option for a more self-contained setup',
    ], `${propertySeed}:whole-place`);
  }

  const budgetMax = Number(seekerPrefs?.budget_max || 0);
  if (budgetMax > 0 && typeof property.price_per_month === 'number' && property.price_per_month <= budgetMax) {
    pushReasonEntry(reasonEntries, 'budget', [
      'Within your budget',
      'Budget-friendly for your range',
      'Fits comfortably within your price range',
    ], `${propertySeed}:budget:${budgetMax}:${property.price_per_month}`);
  }

  const locations = [
    ...(Array.isArray(seekerPrefs?.location_areas) ? seekerPrefs.location_areas : []),
    seekerLifestyle?.current_city,
  ]
    .map((value) => String(value || '').toLowerCase().trim())
    .filter(Boolean);
  const propertyCity = String(property.city || '').toLowerCase().trim();
  const propertyState = String(property.state || '').toLowerCase().trim();
  if (locations.some((value) => value === propertyCity || value === propertyState || propertyCity.includes(value))) {
    pushReasonEntry(reasonEntries, 'location', [
      'Matches your preferred area',
      'In an area you have been looking at',
      'Location lines up with your search',
    ], `${propertySeed}:location:${propertyCity}:${propertyState}`);
  }

  const prioritizedCategories = ['lifestyle', 'setup', 'budget', 'location'];
  const selected = [];
  const usedCategories = new Set();

  for (const category of prioritizedCategories) {
    const entry = reasonEntries.find((item) => item.category === category && !usedCategories.has(item.category));
    if (!entry) continue;
    selected.push(entry.text);
    usedCategories.add(entry.category);
    if (selected.length >= limit) return selected;
  }

  for (const entry of reasonEntries) {
    if (selected.includes(entry.text)) continue;
    selected.push(entry.text);
    if (selected.length >= limit) break;
  }

  return selected;
}

export function buildPeopleMatchReasons({
  actorLifestyle = null,
  counterpartLifestyle = null,
  property = null,
  limit = 3,
} = {}) {
  const reasons = [];

  const actorSchedule = normalizeScheduleType(actorLifestyle?.schedule_type);
  const counterpartSchedule = normalizeScheduleType(counterpartLifestyle?.schedule_type);
  if (actorSchedule && counterpartSchedule && actorSchedule === counterpartSchedule) {
    pushUniqueReason(reasons, `Compatible ${formatScheduleLabel(actorLifestyle?.schedule_type)}`);
  }

  if (
    Number.isFinite(Number(actorLifestyle?.cleanliness_level)) &&
    Number.isFinite(Number(counterpartLifestyle?.cleanliness_level)) &&
    Math.abs(Number(actorLifestyle.cleanliness_level) - Number(counterpartLifestyle.cleanliness_level)) <= 1
  ) {
    pushUniqueReason(reasons, 'Similar cleanliness standard');
  }

  const actorInterests = normalizeInterestSet(actorLifestyle?.interests);
  const counterpartInterests = normalizeInterestSet(counterpartLifestyle?.interests);
  const sharedInterests = [...actorInterests].filter((value) => counterpartInterests.has(value));
  if (sharedInterests.length > 0) {
    pushUniqueReason(reasons, `Shared interests like ${titleCase(sharedInterests[0])}`);
  }

  if (
    Number.isFinite(Number(actorLifestyle?.noise_tolerance)) &&
    Number.isFinite(Number(counterpartLifestyle?.noise_tolerance)) &&
    Math.abs(Number(actorLifestyle.noise_tolerance) - Number(counterpartLifestyle.noise_tolerance)) <= 1
  ) {
    pushUniqueReason(reasons, 'Noise preferences line up');
  }

  if (
    Number.isFinite(Number(actorLifestyle?.social_level)) &&
    Number.isFinite(Number(counterpartLifestyle?.social_level)) &&
    Math.abs(Number(actorLifestyle.social_level) - Number(counterpartLifestyle.social_level)) <= 1
  ) {
    pushUniqueReason(reasons, 'Similar social energy');
  }

  if (property?.title) {
    pushUniqueReason(reasons, `Strong fit for ${property.title}`);
  }

  return reasons.slice(0, limit);
}
