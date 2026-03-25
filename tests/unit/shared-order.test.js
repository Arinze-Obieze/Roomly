import { describe, expect, test } from 'vitest';
import {
  comparePeopleDiscoveryRanking,
  comparePropertyRanking,
} from '../../core/services/matching/ranking/shared-order.js';

describe('shared ranking order', () => {
  test('uses recommended score, then match score, then recency for property ranking', () => {
    const items = [
      { id: 'older-high-match', _recScore: 88, matchScore: 92, createdAt: '2026-03-20T10:00:00.000Z' },
      { id: 'newer-same-rec', _recScore: 88, matchScore: 92, createdAt: '2026-03-24T10:00:00.000Z' },
      { id: 'best-rec', _recScore: 92, matchScore: 80, createdAt: '2026-03-18T10:00:00.000Z' },
    ];

    const ranked = [...items].sort((a, b) => comparePropertyRanking(a, b, 'recommended'));

    expect(ranked.map((item) => item.id)).toEqual([
      'best-rec',
      'newer-same-rec',
      'older-high-match',
    ]);
  });

  test('prefers complete profiles before score ties in people discovery when requested', () => {
    const candidates = [
      {
        user_id: 'partial-higher-score',
        has_match_preferences: false,
        match_score: 88,
        match_confidence: 80,
        can_contact_directly: true,
        is_verified: true,
      },
      {
        user_id: 'complete-slightly-lower',
        has_match_preferences: true,
        match_score: 85,
        match_confidence: 70,
        can_contact_directly: false,
        is_verified: false,
      },
    ];

    const ranked = [...candidates].sort((a, b) =>
      comparePeopleDiscoveryRanking(a, b, { preferCompleteProfiles: true })
    );

    expect(ranked.map((item) => item.user_id)).toEqual([
      'complete-slightly-lower',
      'partial-higher-score',
    ]);
  });

  test('uses score, confidence, reveal state, and verification as stable people tie-breaks', () => {
    const candidates = [
      {
        user_id: 'revealed-verified',
        match_score: 84,
        reciprocal_signal: 70,
        match_confidence: 90,
        can_contact_directly: true,
        is_verified: true,
      },
      {
        user_id: 'blurred-unverified',
        match_score: 84,
        reciprocal_signal: 70,
        match_confidence: 75,
        can_contact_directly: false,
        is_verified: false,
      },
      {
        user_id: 'revealed-unverified',
        match_score: 84,
        reciprocal_signal: 70,
        match_confidence: 90,
        can_contact_directly: true,
        is_verified: false,
      },
    ];

    const ranked = [...candidates].sort((a, b) => comparePeopleDiscoveryRanking(a, b));

    expect(ranked.map((item) => item.user_id)).toEqual([
      'revealed-verified',
      'revealed-unverified',
      'blurred-unverified',
    ]);
  });

  test('uses reciprocal signal before confidence when scores tie', () => {
    const candidates = [
      {
        user_id: 'higher-confidence',
        match_score: 84,
        reciprocal_signal: 60,
        match_confidence: 95,
      },
      {
        user_id: 'higher-reciprocal',
        match_score: 84,
        reciprocal_signal: 95,
        match_confidence: 70,
      },
    ];

    const ranked = [...candidates].sort((a, b) => comparePeopleDiscoveryRanking(a, b));

    expect(ranked.map((item) => item.user_id)).toEqual([
      'higher-reciprocal',
      'higher-confidence',
    ]);
  });
});
