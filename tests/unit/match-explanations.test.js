import { describe, expect, test } from 'vitest';
import {
  buildPeopleMatchReasons,
  buildPropertyMatchReasons,
} from '../../core/services/matching/presentation/match-explanations.js';

describe('match explanations', () => {
  test('builds concise property match reasons from available signals', () => {
    const reasons = buildPropertyMatchReasons({
      property: {
        city: 'Dublin',
        state: 'Dublin',
        price_per_month: 1100,
        offering_type: 'private_room',
        property_type: 'apartment',
      },
      seekerLifestyle: {
        current_city: 'Dublin',
        schedule_type: '9-5',
        interests: ['music', 'cooking'],
        preferred_property_types: ['apartment'],
      },
      seekerPrefs: {
        budget_max: 1200,
        location_areas: ['Dublin'],
      },
      hostLifestyle: {
        schedule_type: '9-5',
        interests: ['music', 'running'],
      },
    });

    expect(reasons.some((reason) => /routine|Aligned|fit for your/i.test(reason))).toBe(true);
    expect(reasons.some((reason) => /preferred Apartment setup|Apartment fits what you usually look for|Property type matches/i.test(reason))).toBe(true);
    expect(reasons.some((reason) => /budget|price range/i.test(reason))).toBe(true);
    expect(reasons[0]).not.toBe('Within your budget');
    expect(reasons[0]).not.toBe('Matches your preferred area');
    expect(reasons[1]).not.toBe('Matches your preferred area');
  });

  test('builds people match reasons from shared lifestyle fit', () => {
    const reasons = buildPeopleMatchReasons({
      actorLifestyle: {
        schedule_type: 'wfh',
        cleanliness_level: 2,
        noise_tolerance: 2,
        social_level: 2,
        interests: ['gaming', 'films'],
      },
      counterpartLifestyle: {
        schedule_type: 'wfh',
        cleanliness_level: 3,
        noise_tolerance: 2,
        social_level: 1,
        interests: ['films', 'travel'],
      },
      property: {
        title: 'Riverfront Studio',
      },
    });

    expect(reasons.some((reason) => reason.includes('Compatible'))).toBe(true);
    expect(reasons).toContain('Similar cleanliness standard');
    expect(reasons.some((reason) => reason.includes('Shared interests'))).toBe(true);
  });
});
