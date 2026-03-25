import { describe, expect, test } from 'vitest';
import { computeReciprocalAcceptanceSignal } from '../../core/services/matching/scoring/reciprocal-signal.js';

describe('reciprocal acceptance signal', () => {
  test('returns a neutral baseline when there is no reciprocal evidence', () => {
    expect(computeReciprocalAcceptanceSignal()).toBe(50);
  });

  test('boosts accepted people reveals above property-only acceptance', () => {
    const propertyOnly = computeReciprocalAcceptanceSignal({
      hasAcceptedPropertyInterest: true,
    });
    const peopleReveal = computeReciprocalAcceptanceSignal({
      hasAcceptedPeopleInterest: true,
    });

    expect(propertyOnly).toBe(70);
    expect(peopleReveal).toBe(80);
    expect(peopleReveal).toBeGreaterThan(propertyOnly);
  });

  test('caps combined reciprocal signals at 100', () => {
    expect(
      computeReciprocalAcceptanceSignal({
        hasAcceptedPropertyInterest: true,
        hasAcceptedPeopleInterest: true,
        hasPendingPropertyInterest: true,
        hasPendingPeopleInterest: true,
      })
    ).toBe(100);
  });
});
