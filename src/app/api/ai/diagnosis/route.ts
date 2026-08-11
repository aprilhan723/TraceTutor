import { getOptionalAccount } from "@/auth/access";
import { aiDiagnosisRequestSchema } from "@/ai/schemas";
import { getServerAiDiagnosisService } from "@/ai/server-service";
import type { AiActorContext } from "@/domain/ai-diagnosis";
import { getRuntimeMode } from "@/lib/runtime-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: RESPONSE_HEADERS });
}

async function resolveActor(): Promise<AiActorContext | null> {
  if ((await getRuntimeMode()) === "demo") {
    if (process.env.NODE_ENV === "production") return null;
    return { userId: "demo-tutor", organizationId: "demo-organization" };
  }
  const account = await getOptionalAccount();
  if (!account || account.role !== "tutor") return null;
  const supabase = await createSupabaseServerClient();
  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("profile_id", account.id)
    .eq("role", "tutor")
    .is("retired_at", null)
    .limit(1)
    .maybeSingle();
  return membership
    ? { userId: account.id, organizationId: membership.organization_id }
    : null;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).origin !== new URL(request.url).origin) {
    return json({ error: "Cross-origin requests are not allowed." }, 403);
  }
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 16_384) {
    return json({ error: "Request is too large." }, 413);
  }
  const actor = await resolveActor();
  if (!actor) return json({ error: "Tutor access is required." }, 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }
  const parsed = aiDiagnosisRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "The diagnosis request is invalid." }, 400);
  }
  const decision = await getServerAiDiagnosisService().suggest({
    requestId: parsed.data.requestId,
    actor,
    input: parsed.data.input,
  });
  return json(decision);
}
