'use client';

import { useState } from 'react';
import { MdRefresh } from 'react-icons/md';
import { toast } from 'sonner';
import { fetchWithCsrf } from '@/core/utils/fetchWithCsrf';

const SCOPES = [
  {
    value: 'approved_properties',
    label: 'Approved Properties',
    description: 'Recompute seekers against all approved active listings.',
  },
  {
    value: 'all_seekers',
    label: 'All Seekers',
    description: 'Recompute every seeker profile across active listings.',
  },
  {
    value: 'active_properties',
    label: 'All Active Properties',
    description: 'Recompute all active listings, even if not approved yet.',
  },
];

export default function MatchingMaintenancePanel() {
  const [scope, setScope] = useState('approved_properties');
  const [concurrency, setConcurrency] = useState(10);
  const [limit, setLimit] = useState('');
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleRun = async () => {
    setRunning(true);
    try {
      const response = await fetchWithCsrf('/api/superadmin/matching/recompute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope,
          concurrency: Number(concurrency) || 10,
          limit: limit ? Number(limit) : null,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to run matching recompute.');
      }

      setLastResult(payload.results || null);
      toast.success(`Matching recompute finished for ${payload.results?.requested || 0} targets.`);
    } catch (error) {
      toast.error(error?.message || 'Failed to run matching recompute.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Matching Maintenance</h2>
          <p className="text-sm text-slate-500">Run bulk recomputes after backfills, scoring updates, or production fixes.</p>
        </div>
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
        >
          <MdRefresh className={running ? 'animate-spin' : ''} size={18} />
          {running ? 'Running…' : 'Run Recompute'}
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr,0.7fr,0.7fr]">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Scope</label>
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500"
          >
            {SCOPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500">
            {SCOPES.find((option) => option.value === scope)?.description}
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Concurrency</label>
          <input
            type="number"
            min="1"
            max="50"
            value={concurrency}
            onChange={(event) => setConcurrency(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Limit</label>
          <input
            type="number"
            min="1"
            placeholder="Optional"
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
        </div>
      </div>

      {lastResult && (
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['Scope', lastResult.scope],
            ['Requested', lastResult.requested],
            ['Succeeded', lastResult.succeeded],
            ['Failed', lastResult.failed],
            ['Updated Scores', lastResult.updatedScores],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
              <div className="text-base font-bold text-slate-900">{String(value)}</div>
            </div>
          ))}
        </div>
      )}

      {lastResult?.failures?.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          Showing first 5 failures: {lastResult.failures.slice(0, 5).map((item) => `${item.id}: ${item.message}`).join(' | ')}
        </div>
      )}
    </section>
  );
}
