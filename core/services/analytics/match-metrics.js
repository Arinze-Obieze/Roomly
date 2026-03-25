const BAND_ORDER = ['excellent', 'strong', 'good', 'possible', 'low', 'unknown'];

function toSafeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function percent(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function summarizeMatchFeatureEvents(events = []) {
  const summary = {
    impressions: 0,
    profileOpens: 0,
    propertyClicks: 0,
    interests: 0,
    interestAccepts: 0,
    inspectionRequests: 0,
    inspectionConfirmed: 0,
    conversations: 0,
    firstReplies: 0,
    thresholdPassedRate: 0,
    interestRateFromImpressions: 0,
    conversationRateFromInterests: 0,
    byBand: BAND_ORDER.map((band) => ({
      band,
      impressions: 0,
      interests: 0,
      conversations: 0,
    })),
  };

  const bandMap = new Map(summary.byBand.map((entry) => [entry.band, entry]));
  let thresholdKnown = 0;
  let thresholdPassed = 0;

  for (const event of events) {
    const action = String(event?.action || '');
    const metadata = event?.metadata && typeof event.metadata === 'object' ? event.metadata : {};
    const bandKey = String(metadata.match_band || 'unknown');
    const bandEntry = bandMap.get(bandKey) || bandMap.get('unknown');

    if (metadata.threshold_passed === true || metadata.threshold_passed === false) {
      thresholdKnown += 1;
      if (metadata.threshold_passed === true) thresholdPassed += 1;
    }

    if (action === 'property_impression' || action === 'result_impression') {
      summary.impressions += 1;
      bandEntry.impressions += 1;
      continue;
    }

    if (action === 'property_click') {
      summary.propertyClicks += 1;
      continue;
    }

    if (action === 'result_profile_open') {
      summary.profileOpens += 1;
      continue;
    }

    if (action === 'show_property_interest' || action === 'show_people_interest') {
      summary.interests += 1;
      bandEntry.interests += 1;
      continue;
    }

    if (action === 'interest_accepted') {
      summary.interestAccepts += 1;
      continue;
    }

    if (action === 'inspection_requested') {
      summary.inspectionRequests += 1;
      continue;
    }

    if (action === 'inspection_confirmed') {
      summary.inspectionConfirmed += 1;
      continue;
    }

    if (action === 'start_conversation') {
      summary.conversations += 1;
      bandEntry.conversations += 1;
      continue;
    }

    if (action === 'first_reply') {
      summary.firstReplies += 1;
    }
  }

  summary.thresholdPassedRate = percent(thresholdPassed, thresholdKnown);
  summary.interestRateFromImpressions = percent(summary.interests, summary.impressions);
  summary.conversationRateFromInterests = percent(summary.conversations, summary.interests);

  return summary;
}
