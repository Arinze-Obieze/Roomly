"use client";

import UsersTable from "@/components/superadmin/users/UsersTable";

export default function UsersManagementPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold font-spaceGrotesk text-slate-900">User Management</h1>
        <p className="text-slate-500 mt-1">View and manage platform users</p>
      </div>
      
      <div className="flex-1 min-h-0">
         <UsersTable />
      </div>
    </div>
  );
}
