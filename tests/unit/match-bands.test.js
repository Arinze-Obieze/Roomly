import { describe, expect, test } from 'vitest';
import {
  getCompatibilityFilterLabel,
  getMatchBand,
} from '../../core/services/matching/presentation/match-bands.js';

describe('match bands', () => {
  test('maps match scores into consistent qualitative bands', () => {
    expect(getMatchBand(92)).toMatchObject({ key: 'excellent', label: 'Excellent Match' });
    expect(getMatchBand(84)).toMatchObject({ key: 'strong', label: 'Strong Match' });
    expect(getMatchBand(73)).toMatchObject({ key: 'good', label: 'Good Match' });
    expect(getMatchBand(61)).toMatchObject({ key: 'possible', label: 'Possible Match' });
    expect(getMatchBand(48)).toMatchObject({ key: 'low', label: 'Low Match' });
  });

  test('maps compatibility filter values into stable labels', () => {
    expect(getCompatibilityFilterLabel(60)).toBe('Any match');
    expect(getCompatibilityFilterLabel(70)).toBe('Good');
    expect(getCompatibilityFilterLabel(80)).toBe('Strong');
    expect(getCompatibilityFilterLabel(90)).toBe('Excellent');
    expect(getCompatibilityFilterLabel(100)).toBe('Perfect only');
  });
});
