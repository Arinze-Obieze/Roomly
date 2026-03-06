"use client";

import SystemLogsTable from '@/components/superadmin/logs/SystemLogsTable';

export default function SystemLogsPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold font-spaceGrotesk text-slate-900">System Monitoring</h1>
        <p className="text-slate-500 mt-1">Central log stream for operational visibility and incident response</p>
      </div>

      <div className="flex-1 min-h-0">
        <SystemLogsTable />
      </div>
    </div>
  );
}
