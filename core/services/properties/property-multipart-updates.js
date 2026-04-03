export const parseJsonArrayField = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const parseJsonObjectField = (value, fallback = {}) => {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export const readNullableStringField = (value) => {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
};

export const readOptionalNumberField = (value) => {
  if (value === null || value === undefined || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

export function buildPropertyMultipartUpdates(formData) {
  const get = (key) => formData.get(key);
  const propertyType = get('property_category') || get('property_type');
  const squareMeters = get('floor_area') || get('square_meters');
  const billsOption = get('bills_option') || 'some';
  const dealBreakers = parseJsonArrayField(get('deal_breakers'));
  const couplesAllowed = get('couples_allowed') === 'true';
  const houseRules = [];

  if (!dealBreakers.includes('smokers')) houseRules.push('no_smoking');
  if (!dealBreakers.includes('pets')) houseRules.push('pets_allowed');
  if (couplesAllowed) houseRules.push('couples_welcome');
  if (!dealBreakers.includes('students')) houseRules.push('students_welcome');

  const updates = {
    title: get('title'),
    description: get('description'),
    listed_by_role: get('role') !== null ? (get('role') || 'live_out_landlord') : undefined,
    rental_type: get('rental_type') || undefined,
    fixed_term_duration: readOptionalNumberField(get('fixed_term_duration')),
    property_type: propertyType || undefined,
    offering_type: get('offering_type') || undefined,
    price_per_month: readOptionalNumberField(get('price_per_month')),
    state: get('state'),
    city: get('city'),
    street: get('street'),
    bedrooms: readOptionalNumberField(get('bedrooms')),
    bathrooms: readOptionalNumberField(get('bathrooms')),
    square_meters: squareMeters ? Number(squareMeters) : undefined,
    year_built: readOptionalNumberField(get('year_built')),
    ber_rating: readNullableStringField(get('ber_rating')),
    available_from: readNullableStringField(get('available_from')),
    transport_options: parseJsonArrayField(get('transport_options')),
    is_gaeltacht: get('is_gaeltacht') === 'true',
    amenities: parseJsonArrayField(get('amenities')),
    deposit: readOptionalNumberField(get('deposit')),
    bills_option: billsOption,
    bills_included: billsOption === 'box',
    custom_bills: parseJsonArrayField(get('custom_bills')),
    couples_allowed: couplesAllowed,
    payment_methods: parseJsonArrayField(get('payment_methods')),
    occupation_preference: get('occupation_preference') || undefined,
    gender_preference: get('gender_preference') || undefined,
    age_min: readOptionalNumberField(get('age_min')),
    age_max: readOptionalNumberField(get('age_max')),
    lifestyle_priorities: parseJsonObjectField(get('lifestyle_priorities'), {}),
    deal_breakers: dealBreakers,
    partner_description: readNullableStringField(get('partner_description')),
    is_immediate: get('is_immediate') === 'true',
    min_stay_months: readOptionalNumberField(get('min_stay_months')),
    accept_viewings: get('accept_viewings') === 'true',
    is_public: get('is_public') !== null ? get('is_public') === 'true' : undefined,
    room_type: readNullableStringField(get('room_type')),
    house_rules: houseRules,
  };

  return Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );
}
