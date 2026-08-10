import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { requireSupabasePublicConfig } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  const config = requireSupabasePublicConfig();
  return createBrowserClient<Database>(config.url, config.publishableKey);
}
