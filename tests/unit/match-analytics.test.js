import { describe, expect, test } from 'vitest';
import { buildMatchAnalyticsMetadata } from '../../core/services/matching/presentation/match-analytics.js';

describe('match analytics metadata', () => {
  test('builds match band and threshold metadata from a score', () => {
    expect(
      buildMatchAnalyticsMetadata({
        matchScore: 82,
        threshold: 70,
        surface: 'find_people',
        entityType: 'person',
      })
    ).toMatchObject({
      surface: 'find_people',
      entity_type: 'person',
      match_score: 82,
      match_band: 'strong',
      match_band_label: 'Strong Match',
      threshold: 70,
      threshold_passed: true,
    });
  });

  test('handles missing score safely', () => {
    expect(
      buildMatchAnalyticsMetadata({
        threshold: 51,
        surface: 'messages',
        entityType: 'property',
      })
    ).toMatchObject({
      match_score: null,
      match_band: null,
      threshold_passed: null,
    });
  });

  test('includes ranking, privacy, reveal, and profile completion metadata when provided', () => {
    expect(
      buildMatchAnalyticsMetadata({
        matchScore: 74,
        threshold: 70,
        surface: 'find_people',
        entityType: 'person',
        userId: 'viewer-1',
        blurred: true,
        revealState: 'blurred',
        rankPosition: 3,
        privacyState: 'private',
        profileCompletionState: 'partial',
      })
    ).toMatchObject({
      user_id: 'viewer-1',
      blurred: true,
      reveal_state: 'blurred',
      rank_position: 3,
      privacy_state: 'private',
      profile_completion_state: 'partial',
    });
  });
});
