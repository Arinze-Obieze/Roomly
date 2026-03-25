function toFiniteNumber(value, fallback = null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toTimestamp(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function compareNumberDesc(a, b) {
  const left = toFiniteNumber(a, null);
  const right = toFiniteNumber(b, null);
  if (left === right) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return right - left;
}

function compareBooleanDesc(a, b) {
  if (!!a === !!b) return 0;
  return a ? -1 : 1;
}

function compareDateDesc(a, b) {
  const left = toTimestamp(a);
  const right = toTimestamp(b);
  if (left === right) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return right - left;
}

function compareTextAsc(a, b) {
  const left = a == null ? '' : String(a);
  const right = b == null ? '' : String(b);
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function comparePropertyRanking(a, b, sortBy = 'match') {
  if (sortBy === 'recommended') {
    const recDiff = compareNumberDesc(a?._recScore, b?._recScore);
    if (recDiff !== 0) return recDiff;
  }

  const scoreDiff = compareNumberDesc(a?.matchScore, b?.matchScore);
  if (scoreDiff !== 0) return scoreDiff;

  const createdDiff = compareDateDesc(a?.createdAt, b?.createdAt);
  if (createdDiff !== 0) return createdDiff;

  return compareTextAsc(a?.id, b?.id);
}

export function comparePeopleDiscoveryRanking(a, b, options = {}) {
  const {
    preferCompleteProfiles = false,
    completeProfileKey = 'has_match_preferences',
    scoreKey = 'match_score',
    reciprocalSignalKey = 'reciprocal_signal',
    confidenceKey = 'match_confidence',
    revealedKey = 'can_contact_directly',
    verifiedKey = 'is_verified',
    recencyKey = 'updated_at',
    fallbackRecencyKey = 'created_at',
    idKey = 'user_id',
  } = options;

  if (preferCompleteProfiles) {
    const completionDiff = compareBooleanDesc(a?.[completeProfileKey], b?.[completeProfileKey]);
    if (completionDiff !== 0) return completionDiff;
  }

  const scoreDiff = compareNumberDesc(a?.[scoreKey], b?.[scoreKey]);
  if (scoreDiff !== 0) return scoreDiff;

  const reciprocalSignalDiff = compareNumberDesc(a?.[reciprocalSignalKey], b?.[reciprocalSignalKey]);
  if (reciprocalSignalDiff !== 0) return reciprocalSignalDiff;

  const confidenceDiff = compareNumberDesc(a?.[confidenceKey], b?.[confidenceKey]);
  if (confidenceDiff !== 0) return confidenceDiff;

  const revealDiff = compareBooleanDesc(a?.[revealedKey], b?.[revealedKey]);
  if (revealDiff !== 0) return revealDiff;

  const verifiedDiff = compareBooleanDesc(a?.[verifiedKey], b?.[verifiedKey]);
  if (verifiedDiff !== 0) return verifiedDiff;

  const recencyDiff = compareDateDesc(a?.[recencyKey], b?.[recencyKey]);
  if (recencyDiff !== 0) return recencyDiff;

  const fallbackRecencyDiff = compareDateDesc(a?.[fallbackRecencyKey], b?.[fallbackRecencyKey]);
  if (fallbackRecencyDiff !== 0) return fallbackRecencyDiff;

  return compareTextAsc(a?.[idKey], b?.[idKey]);
}
