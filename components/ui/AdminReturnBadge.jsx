"use client";

import { useAuthContext } from "@/core/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { MdAdminPanelSettings } from "react-icons/md";
import { useEffect, useState } from "react";

export default function AdminReturnBadge() {
  const { user } = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch
  if (!mounted) return null;

  // Only show if the user is explicitly a superadmin
  if (!user?.is_superadmin) return null;

  // Hide the badge if the user is already inside the superadmin dashboard space
  if (pathname?.startsWith("/superadmin")) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <button
        onClick={() => router.push("/superadmin")}
        className="flex items-center gap-2 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-full shadow-2xl hover:-translate-y-1 hover:shadow-black/40 transition-all duration-300 group"
      >
        <div className="bg-primary/20 p-1.5 rounded-full text-primary">
          <MdAdminPanelSettings size={22} className="group-hover:scale-110 transition-transform duration-300" />
        </div>
        <span className="font-semibold text-sm pr-1">Return to Admin</span>
      </button>
    </div>
  );
}
