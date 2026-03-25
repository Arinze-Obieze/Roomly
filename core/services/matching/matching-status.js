export function resolveMatchingStatus({
  scoreCount = 0,
  propertyCount = 0,
  hasLifestyle = false,
  hasPreferences = false,
  hasScoreError = false,
  hasPropertyError = false,
} = {}) {
  if (hasScoreError || hasPropertyError) {
    return {
      hasScores: false,
      count: 0,
      expected: 0,
      missingProfile: false,
    };
  }

  const missingProfile = !hasLifestyle && !hasPreferences;
  const count = Number(scoreCount) || 0;
  const expected = Number(propertyCount) || 0;

  return {
    hasScores: missingProfile ? true : (expected === 0 ? true : count >= expected),
    count,
    expected,
    missingProfile,
  };
}
