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

function resolvePriceBand(pricePerMonth) {
  const numeric = Number(pricePerMonth);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  if (numeric < 800) return 'budget';
  if (numeric < 1500) return 'mid';
  return 'premium';
}

function resolveFreshnessBucket(createdAt, now = new Date()) {
  if (!createdAt) return null;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return null;
  const ageHours = Math.max(0, (now.getTime() - created.getTime()) / 36e5);
  if (ageHours <= 48) return 'new';
  if (ageHours <= 24 * 14) return 'warm';
  return 'stale';
}

export function buildPropertyMatchingFeatures({
  property = {},
  hostLifestyle = null,
  mediaCount = 0,
  now = new Date(),
} = {}) {
  const numericMediaCount = Number.isFinite(Number(mediaCount)) ? Number(mediaCount) : 0;
  const pricePerMonth = Number.isFinite(Number(property?.price_per_month))
    ? Number(property.price_per_month)
    : null;

  return {
    property_id: property?.id || null,
    host_user_id: property?.listed_by_user_id || null,
    approval_status: property?.approval_status || null,
    is_active: property?.is_active === true,
    is_private: property?.privacy_setting === 'private' || property?.is_public === false,
    city_normalized: normalizeText(property?.city),
    state_normalized: normalizeText(property?.state),
    price_per_month: pricePerMonth,
    price_band: resolvePriceBand(pricePerMonth),
    property_type: normalizeText(property?.property_type),
    offering_type: normalizeText(property?.offering_type),
    available_from: property?.available_from || null,
    media_count: numericMediaCount,
    has_media: numericMediaCount > 0,
    host_schedule_type: normalizeText(hostLifestyle?.schedule_type),
    host_interests: normalizeArray(hostLifestyle?.interests),
    freshness_bucket: resolveFreshnessBucket(property?.created_at, now),
    updated_at: now.toISOString(),
  };
}
