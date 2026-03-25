function resolveTimestamp(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function computeRecommendedScore(item, now = new Date()) {
  const createdAt = resolveTimestamp(item?.createdAt ?? item?.created_at);
  const ageHours = createdAt ? Math.max(0, (now - createdAt) / 36e5) : 0;
  const freshness = Math.max(0, 100 - ageHours / 7.2);
  const match = typeof item?.matchScore === 'number'
    ? item.matchScore
    : (typeof item?.score === 'number' ? item.score : 0);
  const hasPhotos =
    (Array.isArray(item?.images) && item.images.length > 0) ||
    (Array.isArray(item?.property_media) && item.property_media.length > 0);
  const isVerified =
    item?.verified === true ||
    item?.isVerifiedHost === true ||
    item?.host?.is_verified === true;
  const quality = (hasPhotos ? 50 : 0) + (isVerified ? 50 : 0);

  return (match * 0.70) + (freshness * 0.20) + (quality * 0.10);
}
