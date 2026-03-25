export function getMatchConfidenceState(confidence = 0) {
  const normalized = Number.isFinite(Number(confidence)) ? Number(confidence) : 0;

  if (normalized >= 80) {
    return {
      state: 'high',
      label: 'Strong data',
    };
  }

  if (normalized >= 55) {
    return {
      state: 'medium',
      label: 'Moderate data',
    };
  }

  return {
    state: 'low',
    label: 'Limited data',
  };
}
