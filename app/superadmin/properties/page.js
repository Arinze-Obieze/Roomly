"use client";

import PropertiesTable from "@/components/superadmin/properties/PropertiesTable";

export default function PropertiesManagementPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold font-spaceGrotesk text-slate-900">Property Management</h1>
        <p className="text-slate-500 mt-1">View, manage, and moderate all platform listings</p>
      </div>
      
      <div className="flex-1 min-h-0">
         <PropertiesTable />
      </div>
    </div>
  );
}
