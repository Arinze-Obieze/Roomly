export function resolveShowPropertyInterestDecision({
  property = null,
  userId = null,
  hasLifestyle = false,
  matchScore = null,
} = {}) {
  if (!userId) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  if (!property?.id) {
    return { ok: false, status: 404, error: 'Property not found' };
  }

  if (property.listed_by_user_id === userId) {
    return { ok: false, status: 400, error: 'Cannot show interest in your own listing' };
  }

  if (!property.is_active) {
    return { ok: false, status: 400, error: 'This listing is no longer active' };
  }

  if (!hasLifestyle) {
    return {
      ok: false,
      status: 400,
      error: 'Complete your lifestyle in Profile to show interest.',
    };
  }

  const isPrivateListing = property.privacy_setting === 'private' || property.is_public === false;
  const numericScore = Number(matchScore);
  const hasValidScore = Number.isFinite(numericScore);
  const initialStatus = (!hasValidScore || isPrivateListing)
    ? 'pending'
    : (numericScore <= 50 ? 'pending' : 'accepted');

  return {
    ok: true,
    status: 200,
    initialStatus,
    isPrivateListing,
  };
}
