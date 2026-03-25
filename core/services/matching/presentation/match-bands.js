export function getMatchBand(score) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) {
    return {
      key: 'unknown',
      label: 'Match',
      shortLabel: 'Match',
      description: 'Compatibility score',
    };
  }

  if (numericScore >= 90) {
    return {
      key: 'excellent',
      label: 'Excellent Match',
      shortLabel: 'Excellent',
      description: 'Very strong compatibility',
    };
  }

  if (numericScore >= 80) {
    return {
      key: 'strong',
      label: 'Strong Match',
      shortLabel: 'Strong',
      description: 'Strong compatibility',
    };
  }

  if (numericScore >= 70) {
    return {
      key: 'good',
      label: 'Good Match',
      shortLabel: 'Good',
      description: 'Good compatibility',
    };
  }

  if (numericScore >= 60) {
    return {
      key: 'possible',
      label: 'Possible Match',
      shortLabel: 'Possible',
      description: 'Worth a closer look',
    };
  }

  return {
    key: 'low',
    label: 'Low Match',
    shortLabel: 'Low',
    description: 'Lower compatibility',
  };
}

export function getCompatibilityFilterLabel(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 'Any match';

  if (numericValue >= 100) return 'Perfect only';
  if (numericValue >= 90) return 'Excellent';
  if (numericValue >= 80) return 'Strong';
  if (numericValue >= 70) return 'Good';
  return 'Any match';
}
