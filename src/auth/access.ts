import { redirect } from "next/navigation";
import type { AccountRole } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RouteAccessDecision =
  | { outcome: "demo" }
  | { outcome: "sign-in" }
  | { outcome: "complete-profile"; userId: string }
  | { outcome: "wrong-role"; role: AccountRole }
  | {
      outcome: "allowed";
      userId: string;
      role: AccountRole;
      displayName: string;
    };

export function decideRouteAccess(input: {
  configured: boolean;
  userId: string | null;
  profile: { role: AccountRole; displayName: string } | null;
  requiredRole: AccountRole;
}): RouteAccessDecision {
  if (!input.configured) return { outcome: "demo" };
  if (!input.userId) return { outcome: "sign-in" };
  if (!input.profile) {
    return { outcome: "complete-profile", userId: input.userId };
  }
  if (input.profile.role !== input.requiredRole) {
    return { outcome: "wrong-role", role: input.profile.role };
  }
  return {
    outcome: "allowed",
    userId: input.userId,
    role: input.profile.role,
    displayName: input.profile.displayName,
  };
}

export type AuthenticatedAccount = Extract<
  RouteAccessDecision,
  { outcome: "allowed" }
>;

export async function requireAccountRole(
  requiredRole: AccountRole,
): Promise<AuthenticatedAccount | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsError ? null : (claimsData?.claims.sub ?? null);
  let profile: { role: AccountRole; displayName: string } | null = null;

  if (userId) {
    const { data } = await supabase
      .from("profiles")
      .select("role, display_name")
      .eq("id", userId)
      .is("retired_at", null)
      .maybeSingle();
    if (data) profile = { role: data.role, displayName: data.display_name };
  }

  const decision = decideRouteAccess({
    configured: true,
    userId,
    profile,
    requiredRole,
  });
  if (decision.outcome === "sign-in") redirect("/auth/sign-in");
  if (decision.outcome === "complete-profile")
    redirect("/auth/complete-profile");
  if (decision.outcome === "wrong-role") {
    redirect(decision.role === "tutor" ? "/tutor/dashboard" : "/student/today");
  }
  if (decision.outcome !== "allowed") {
    throw new Error("Unexpected authorization state.");
  }
  return decision;
}

export async function getOptionalAccount() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, display_name")
    .eq("id", data.claims.sub)
    .maybeSingle();
  return profile;
}
