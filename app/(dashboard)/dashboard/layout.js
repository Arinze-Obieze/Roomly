"use client";

import { FilterSidebar, RightSidebar } from "@/components/dashboard";

export default function DashboardLayout({ children }) {
  return (
    <>
      <FilterSidebar />

      <main className="relative min-h-screen xl:pl-80 2xl:pr-80">
        {children}
      </main>

      <RightSidebar />
    </>
  );
}