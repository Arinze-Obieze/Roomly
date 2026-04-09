"use client";

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { MdRefresh, MdSearch } from 'react-icons/md';

const LEVELS = ['', 'error', 'warn', 'info', 'debug'];
const SERVICES = ['', 'superadmin', 'support', 'moderation', 'messaging', 'buddy', 'profile', 'properties', 'auth', 'app'];
const STATUSES = ['', 'success', 'failed', 'pending', 'in_progress'];

const badgeClass = (level) => {
  if (level === 'error') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (level === 'warn') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (level === 'info') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

export default function SystemLogsTable() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [level, setLevel] = useState('');
  const [service, setService] = useState('');
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [draftQuery, setDraftQuery] = useState('');
  const [hideSuperadmin, setHideSuperadmin] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });

    if (level) params.set('level', level);
    if (service) params.set('service', service);
    if (status) params.set('status', status);
    if (query) params.set('q', query);
    if (hideSuperadmin) params.set('hideSuperadmin', 'true');

    return params.toString();
  }, [page, pageSize, level, service, status, query, hideSuperadmin]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/superadmin/system-logs?${queryString}`, {
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load system logs.');
      }

      setLogs(payload.logs || []);
      setTotal(payload.total || 0);
    } catch (error) {
      console.error('[superadmin] system logs fetch failed:', error);
      toast.error(error?.message || 'Failed to load system logs.');
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [queryString]);

  const applySearch = () => {
    setPage(1);
    setQuery(draftQuery.trim());
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold font-spaceGrotesk text-slate-900">System Logs</h2>
            <p className="text-sm text-slate-500">Monitor service activity, errors, and operational events</p>
          </div>

          <button
            type="button"
            onClick={fetchLogs}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm"
          >
            <MdRefresh size={16} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="xl:col-span-2 flex gap-2">
            <div className="relative flex-1">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applySearch();
                }}
                placeholder="Search message, action, request id"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <button
              type="button"
              onClick={applySearch}
              className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm"
            >
              Search
            </button>
          </div>

          <select value={level} onChange={(e) => { setPage(1); setLevel(e.target.value); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            {LEVELS.map((l) => (
              <option key={l || 'all'} value={l}>{l ? `Level: ${l}` : 'All levels'}</option>
            ))}
          </select>

          <select
            value={service}
            onChange={(e) => { setPage(1); setService(e.target.value); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            {SERVICES.map((entry) => (
              <option key={entry || 'all-services'} value={entry}>
                {entry ? `Service: ${entry}` : 'All services'}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => { setPage(1); setStatus(e.target.value); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            {STATUSES.map((entry) => (
              <option key={entry || 'all-statuses'} value={entry}>
                {entry ? `Status: ${entry}` : 'All statuses'}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-slate-700 whitespace-nowrap cursor-pointer">
            <input
              type="checkbox"
              checked={hideSuperadmin}
              onChange={(e) => {
                setPage(1);
                setHideSuperadmin(e.target.checked);
              }}
              className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
            />
            Hide Superadmin Activity
          </label>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Level</th>
              <th className="py-3 px-4">Service</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Message</th>
              <th className="py-3 px-4">Request</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">Loading logs...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">No logs found.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full border text-xs font-medium ${badgeClass(log.level)}`}>
                      {log.level || 'unknown'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{log.service || '-'}</td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{log.action || '-'}</td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{log.status || '-'}</td>
                  <td className="py-3 px-4 text-slate-700 max-w-[420px] truncate" title={log.message || ''}>{log.message || '-'}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">{log.request_id || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm">
        <div className="text-slate-500">
          {total === 0
            ? 'Showing 0 of 0'
            : `Showing ${(Math.max(page - 1, 0) * pageSize) + 1} - ${Math.min(page * pageSize, total)} of ${total}`}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value));
            }}
            className="px-2 py-1 border border-slate-200 rounded-md"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}/page</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-md border border-slate-200 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-slate-600">{page} / {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-md border border-slate-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
