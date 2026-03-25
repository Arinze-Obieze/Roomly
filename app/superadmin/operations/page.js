"use client";

import OperationsSection from "@/components/superadmin/dashboard/OperationsSection";

export default function SuperadminOperationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-spaceGrotesk text-slate-900">Operations</h1>
        <p className="text-slate-500 mt-1">Maintenance tools, bulk recomputes, and recovery workflows for platform operations.</p>
      </div>

      <OperationsSection />
    </div>
  );
}

