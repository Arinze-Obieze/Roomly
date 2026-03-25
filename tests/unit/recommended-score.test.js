import { describe, expect, test } from 'vitest';
import { computeRecommendedScore } from '../../core/services/matching/scoring/recommended-score.js';

describe('recommended score', () => {
  const now = new Date('2026-03-25T12:00:00.000Z');

  test('uses the same score shape for listing cards and feed properties', () => {
    const listingScore = computeRecommendedScore({
      createdAt: '2026-03-24T12:00:00.000Z',
      matchScore: 80,
      images: ['photo-1'],
      verified: true,
    }, now);

    const feedScore = computeRecommendedScore({
      created_at: '2026-03-24T12:00:00.000Z',
      score: 80,
      property_media: [{ id: 1 }],
      host: { is_verified: true },
    }, now);

    expect(feedScore).toBe(listingScore);
  });

  test('rewards freshness, photos, and verification', () => {
    const stronger = computeRecommendedScore({
      createdAt: '2026-03-25T06:00:00.000Z',
      matchScore: 75,
      images: ['photo-1'],
      verified: true,
    }, now);

    const weaker = computeRecommendedScore({
      createdAt: '2026-03-10T06:00:00.000Z',
      matchScore: 75,
      images: [],
      verified: false,
    }, now);

    expect(stronger).toBeGreaterThan(weaker);
  });
});
