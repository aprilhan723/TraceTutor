import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEMO_MODE_COOKIE } from "@/lib/runtime-mode-constants";

export { DEMO_MODE_COOKIE } from "@/lib/runtime-mode-constants";

export async function getRuntimeMode(): Promise<"demo" | "supabase"> {
  if (!isSupabaseConfigured()) return "demo";
  const cookieStore = await cookies();
  return cookieStore.get(DEMO_MODE_COOKIE)?.value === "1" ? "demo" : "supabase";
}

export async function isSupabaseRuntime() {
  return (await getRuntimeMode()) === "supabase";
}
