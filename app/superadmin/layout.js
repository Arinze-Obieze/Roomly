"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/core/contexts/AuthContext";
import { createClient } from "@/core/utils/supabase/client";
import SuperAdminHeader from "@/components/superadmin/layout/SuperAdminHeader";
import SuperAdminSidebar from "@/components/superadmin/layout/SuperAdminSidebar";
import { Toaster } from "sonner"; // Assuming sonner is used based on package.json

export default function SuperAdminLayout({ children }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [roleStatus, setRoleStatus] = useState("checking");
  const [roleError, setRoleError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const checkRole = async () => {
      if (loading) return;

      setRoleError("");

      if (!user) {
        if (active) setRoleStatus("unauthorized");
        return;
      }

      // Fast path: metadata/profile value already indicates superadmin.
      if (user?.is_superadmin || user?.user_metadata?.is_superadmin || user?.app_metadata?.is_superadmin) {
        if (active) setRoleStatus("authorized");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("is_superadmin")
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (!active) return;
        setRoleStatus(data?.is_superadmin ? "authorized" : "unauthorized");
      } catch (err) {
        console.error("Error checking superadmin role:", err);
        if (!active) return;
        setRoleStatus("error");
        setRoleError("Unable to verify superadmin access right now. Please retry.");
      }
    };

    checkRole();
    return () => {
      active = false;
    };
  }, [user, loading, supabase, retryKey]);

  // Handle redirects
  useEffect(() => {
    if (loading || roleStatus === "checking" || roleStatus === "error") return;

    if (!user) {
      router.replace('/login?redirectTo=/superadmin');
      return;
    }

    if (roleStatus === "unauthorized") {
      router.replace('/dashboard');
    }
  }, [user, loading, roleStatus, router]);

  if (loading || roleStatus === "checking") {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-white">{loading ? "Authenticating..." : "Loading Dashboard..."}</p>
      </div>
    );
  }

  if (roleStatus === "error") {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center flex-col gap-4">
        <p className="text-slate-200 text-sm">{roleError}</p>
        <button
          type="button"
          onClick={() => {
            setRoleStatus("checking");
            setRetryKey((v) => v + 1);
          }}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  if (roleStatus !== "authorized") {
    return null; // router.replace handles redirects
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-24 lg:pb-0 flex flex-col">
       <Toaster position="top-right" />
       
       <SuperAdminHeader onMenuClick={() => setSidebarOpen(true)} />
       
       <div className="flex flex-1 max-w-[1920px] w-full mx-auto relative">
         <SuperAdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
         
         <div className="flex-1 min-w-0 flex flex-col p-6 lg:p-8 overflow-y-auto h-[calc(100vh-73px)]">
           {children}
         </div>
       </div>
    </div>
  );
}
