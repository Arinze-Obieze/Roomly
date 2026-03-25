import { describe, expect, test } from 'vitest';
import { summarizeMatchFeatureEvents } from '../../core/services/analytics/match-metrics.js';

describe('match metrics summary', () => {
  test('aggregates funnel counts and rates from feature events', () => {
    const summary = summarizeMatchFeatureEvents([
      { action: 'property_impression', metadata: { match_band: 'strong', threshold_passed: true } },
      { action: 'result_impression', metadata: { match_band: 'good', threshold_passed: true } },
      { action: 'property_click', metadata: { match_band: 'strong', threshold_passed: true } },
      { action: 'result_profile_open', metadata: { match_band: 'good', threshold_passed: true } },
      { action: 'show_property_interest', metadata: { match_band: 'strong', threshold_passed: true } },
      { action: 'interest_accepted', metadata: { match_band: 'strong', threshold_passed: true } },
      { action: 'inspection_requested', metadata: { match_band: 'strong', threshold_passed: true } },
      { action: 'inspection_confirmed', metadata: { match_band: 'strong', threshold_passed: true } },
      { action: 'start_conversation', metadata: { match_band: 'strong', threshold_passed: true } },
      { action: 'first_reply', metadata: { match_band: 'strong', threshold_passed: true } },
    ]);

    expect(summary.impressions).toBe(2);
    expect(summary.propertyClicks).toBe(1);
    expect(summary.profileOpens).toBe(1);
    expect(summary.interests).toBe(1);
    expect(summary.interestAccepts).toBe(1);
    expect(summary.inspectionRequests).toBe(1);
    expect(summary.inspectionConfirmed).toBe(1);
    expect(summary.conversations).toBe(1);
    expect(summary.firstReplies).toBe(1);
    expect(summary.thresholdPassedRate).toBe(100);
    expect(summary.interestRateFromImpressions).toBe(50);
    expect(summary.conversationRateFromInterests).toBe(100);
    expect(summary.byBand.find((entry) => entry.band === 'strong')).toMatchObject({
      impressions: 1,
      interests: 1,
      conversations: 1,
    });
  });
});
