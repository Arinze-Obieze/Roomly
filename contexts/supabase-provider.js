"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { SupabaseContext } from "@/lib/supabase-context";

export default function SupabaseProvider({ children }) {
  const [supabase] = useState(() => createClient());

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}


