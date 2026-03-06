"use client";

import ReportsTable from "@/components/superadmin/reports/ReportsTable";

export default function ReportsManagementPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold font-spaceGrotesk text-slate-900">Reports & Moderation</h1>
        <p className="text-slate-500 mt-1">Review flagged content and user reports</p>
      </div>
      
      <div className="flex-1 min-h-0">
         <ReportsTable />
      </div>
    </div>
  );
}
