import { describe, expect, test } from 'vitest';
import { resolveMatchingStatus } from '../../core/services/matching/matching-status.js';

describe('matching status resolution', () => {
  test('treats missing profile as already satisfied to avoid futile recompute loops', () => {
    expect(
      resolveMatchingStatus({
        scoreCount: 0,
        propertyCount: 12,
        hasLifestyle: false,
        hasPreferences: false,
      })
    ).toEqual({
      hasScores: true,
      count: 0,
      expected: 12,
      missingProfile: true,
    });
  });

  test('requires full score coverage when profile exists and properties are available', () => {
    expect(
      resolveMatchingStatus({
        scoreCount: 9,
        propertyCount: 12,
        hasLifestyle: true,
        hasPreferences: false,
      }).hasScores
    ).toBe(false);

    expect(
      resolveMatchingStatus({
        scoreCount: 12,
        propertyCount: 12,
        hasLifestyle: true,
        hasPreferences: true,
      }).hasScores
    ).toBe(true);
  });

  test('falls back safely when underlying queries error', () => {
    expect(
      resolveMatchingStatus({
        scoreCount: 5,
        propertyCount: 8,
        hasLifestyle: true,
        hasPreferences: true,
        hasScoreError: true,
      })
    ).toEqual({
      hasScores: false,
      count: 0,
      expected: 0,
      missingProfile: false,
    });
  });
});
