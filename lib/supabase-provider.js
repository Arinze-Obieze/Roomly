"use client";

import { useState } from "react";
import { SupabaseContext } from "@/contexts/supabase-context";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SupabaseProvider({ children }) {
  const [supabase] = useState(() => createClientComponentClient());

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}
