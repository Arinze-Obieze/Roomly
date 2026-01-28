"use client";

import { FilterSidebar, RightSidebar } from "@/components/dashboard";

export default function DashboardLayout({ children }) {
  return (
    <>
      <main className="relative min-h-screen">
        {children}
      </main>
    </>
  );
}