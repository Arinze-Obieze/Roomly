import { describe, expect, test } from 'vitest';
import { buildConversationMatchContext } from '../../core/services/matching/presentation/conversation-match-context.js';

describe('conversation match context', () => {
  test('builds seeker-facing conversation context from property fit', () => {
    const context = buildConversationMatchContext({
      viewerRole: 'seeker',
      property: {
        title: 'Docklands Ensuite',
        city: 'Dublin',
        state: 'Dublin',
        price_per_month: 1100,
        offering_type: 'private_room',
      },
      matchScore: 82,
      seekerLifestyle: {
        current_city: 'Dublin',
        schedule_type: '9-5',
      },
      seekerPrefs: {
        budget_max: 1200,
        location_areas: ['Dublin'],
      },
      hostLifestyle: {
        schedule_type: '9-5',
      },
    });

    expect(context.headline).toBe('Why this listing fits you');
    expect(context.matchScore).toBe(82);
    expect(context.reasons.length).toBeGreaterThan(0);
    expect(
      context.reasons.some((reason) =>
        /budget|area|routine|interest|setup|location/i.test(reason)
      )
    ).toBe(true);
  });

  test('builds host-facing conversation context from people fit', () => {
    const context = buildConversationMatchContext({
      viewerRole: 'host',
      property: {
        title: 'Docklands Ensuite',
      },
      matchScore: 76,
      seekerLifestyle: {
        interests: ['music', 'films'],
        cleanliness_level: 2,
      },
      hostLifestyle: {
        interests: ['music', 'travel'],
        cleanliness_level: 2,
      },
    });

    expect(context.headline).toBe('Why this tenant fits your listing');
    expect(context.matchScore).toBe(76);
    expect(context.reasons.some((reason) => reason.includes('Shared interests'))).toBe(true);
  });
});
