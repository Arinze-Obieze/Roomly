import { getMatchBand } from './match-bands.js';

export function buildMatchAnalyticsMetadata({
  matchScore = null,
  threshold = null,
  surface = null,
  entityType = null,
  userId = null,
  blurred = null,
  revealState = null,
  rankPosition = null,
  privacyState = null,
  profileCompletionState = null,
  extra = {},
} = {}) {
  const hasScore = matchScore !== null && matchScore !== undefined && matchScore !== '';
  const numericScore = hasScore ? Number(matchScore) : null;
  const isValidScore = Number.isFinite(numericScore);
  const hasThreshold = threshold !== null && threshold !== undefined && threshold !== '';
  const numericThreshold = hasThreshold ? Number(threshold) : null;
  const isValidThreshold = Number.isFinite(numericThreshold);
  const numericRankPosition = Number(rankPosition);
  const isValidRankPosition = Number.isInteger(numericRankPosition) && numericRankPosition > 0;
  const band = isValidScore ? getMatchBand(numericScore) : null;

  return {
    surface: surface || null,
    entity_type: entityType || null,
    user_id: userId || null,
    match_score: isValidScore ? Math.round(numericScore) : null,
    match_band: band?.key || null,
    match_band_label: band?.label || null,
    threshold: isValidThreshold ? numericThreshold : null,
    threshold_passed: isValidScore && isValidThreshold ? numericScore >= numericThreshold : null,
    blurred: typeof blurred === 'boolean' ? blurred : null,
    reveal_state: revealState || null,
    rank_position: isValidRankPosition ? numericRankPosition : null,
    privacy_state: privacyState || null,
    profile_completion_state: profileCompletionState || null,
    ...extra,
  };
}
