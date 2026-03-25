import { describe, expect, test } from 'vitest';
import { getMatchConfidenceState } from '../../core/services/matching/presentation/match-confidence.js';

describe('match confidence presentation', () => {
  test('maps high confidence to strong data label', () => {
    expect(getMatchConfidenceState(82)).toEqual({
      state: 'high',
      label: 'Strong data',
    });
  });

  test('maps medium confidence to moderate data label', () => {
    expect(getMatchConfidenceState(60)).toEqual({
      state: 'medium',
      label: 'Moderate data',
    });
  });

  test('maps low or invalid confidence to limited data label', () => {
    expect(getMatchConfidenceState(20)).toEqual({
      state: 'low',
      label: 'Limited data',
    });
    expect(getMatchConfidenceState(undefined)).toEqual({
      state: 'low',
      label: 'Limited data',
    });
  });
});
