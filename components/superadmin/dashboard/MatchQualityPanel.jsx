'use client';

const BAND_COPY = {
  excellent: {
    title: 'Excellent matches',
    range: '90-100 score',
    description: 'These are your strongest-scoring recommendations.',
  },
  strong: {
    title: 'Strong matches',
    range: '80-89 score',
    description: 'High-quality recommendations that should still feel very relevant.',
  },
  good: {
    title: 'Good matches',
    range: '70-79 score',
    description: 'Solid recommendations that clear the usual visibility threshold.',
  },
  possible: {
    title: 'Possible matches',
    range: '60-69 score',
    description: 'Borderline candidates that may need stronger signals before converting.',
  },
  low: {
    title: 'Low matches',
    range: 'Below 60',
    description: 'Lower-fit results that rarely lead to intent or conversation.',
  },
  unknown: {
    title: 'Unknown score',
    range: 'No band recorded',
    description: 'Events captured without a usable match band in analytics metadata.',
  },
};

export default function MatchQualityPanel({ data, loading = false }) {
  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 min-h-[260px] animate-pulse" />;
  }

  const summary = data?.ok ? data.value : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Match Quality Funnel</h2>
          <p className="text-sm text-slate-500">
            Last 7 days of how recommendations performed, from being shown to a user through interest and chat creation.
          </p>
        </div>
      </div>

      {!summary ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {data?.error || 'Match analytics are currently unavailable.'}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard label="Results shown" value={summary.impressions} hint="How many recommendation impressions were logged." />
            <MetricCard label="Interests sent" value={summary.interests} hint="How often users acted on a shown result." />
            <MetricCard label="Chats started" value={summary.conversations} hint="How many recommendation paths led to a conversation." />
            <MetricCard label="Reached visibility threshold" value={`${summary.thresholdPassedRate}%`} hint="Share of tracked events that met the current match threshold." />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <MetricCard label="Interest rate from views" value={`${summary.interestRateFromImpressions}%`} hint="Out of shown results, how many turned into an interest action." />
            <MetricCard label="Chat rate from interests" value={`${summary.conversationRateFromInterests}%`} hint="Out of interests sent, how many turned into a conversation." />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Performance by score range</h3>
            <p className="mb-3 text-sm text-slate-500">
              Each row shows how a recommendation score range performed after users actually saw those results.
            </p>
            <div className="space-y-2">
              {summary.byBand
                .filter((entry) => entry.impressions || entry.interests || entry.conversations)
                .map((entry) => (
                  <div
                    key={entry.band}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{BAND_COPY[entry.band]?.title || entry.band}</div>
                      <div className="text-xs text-slate-500">{BAND_COPY[entry.band]?.range}</div>
                      <div className="mt-1 text-xs text-slate-500">{BAND_COPY[entry.band]?.description}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span>{entry.impressions} shown</span>
                      <span>{entry.interests} interests sent</span>
                      <span>{entry.conversations} chats started</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}
