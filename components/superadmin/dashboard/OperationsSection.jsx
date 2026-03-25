'use client';

import MatchingMaintenancePanel from '@/components/superadmin/dashboard/MatchingMaintenancePanel';

export default function OperationsSection() {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold font-spaceGrotesk text-slate-900">Operations</h2>
        <p className="text-sm text-slate-500">
          Maintenance actions and bulk recovery tools live here so the overview stays focused on navigation and platform health.
        </p>
      </div>

      <MatchingMaintenancePanel />
    </section>
  );
}
