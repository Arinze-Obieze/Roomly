"use client";

import { LeftSidebar, RightSidebar } from "@/components/dashboard";

export default function DashboardLayout({ children }) {
  return (
    <>
      <LeftSidebar />

      <main className="relative min-h-screen xl:pl-72 2xl:pr-80">
        {children}
      </main>

      <RightSidebar />
    </>
  );
}