import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_MODE_COOKIE } from "@/lib/runtime-mode";

const allowedTypes = new Set<EmailOtpType>([
  "email",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
]);

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get("code");
  const supabase = await createSupabaseServerClient();
  let verified = false;

  if (tokenHash && type && allowedTypes.has(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    verified = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    verified = !error;
  }

  const target = request.nextUrl.clone();
  target.search = "";
  target.pathname = verified ? "/auth/continue" : "/auth/expired";
  const response = NextResponse.redirect(target);
  if (verified) response.cookies.delete(DEMO_MODE_COOKIE);
  return response;
}
