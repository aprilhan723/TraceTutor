import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import {
  CACHEABLE_DEMO_HEADER,
  DEMO_MODE_COOKIE,
  isApplicationPath,
  requiresPrivateAccountCache,
} from "@/lib/runtime-mode-constants";

export async function updateSupabaseSession(request: NextRequest) {
  const config = getSupabasePublicConfig();
  const path = request.nextUrl.pathname;
  if (!config) {
    const demoResponse = NextResponse.next({ request });
    if (isApplicationPath(path)) {
      demoResponse.headers.set(CACHEABLE_DEMO_HEADER, "1");
    }
    return demoResponse;
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(
    config.url,
    config.publishableKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet, headersToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          if (headersToSet) {
            for (const [name, value] of Object.entries(headersToSet)) {
              response.headers.set(name, value);
            }
          }
        },
      },
    },
  );

  await supabase.auth.getClaims();
  const explicitDemo = request.cookies.get(DEMO_MODE_COOKIE)?.value === "1";
  if (requiresPrivateAccountCache(path, explicitDemo)) {
    response.headers.set("Cache-Control", "private, no-store");
  } else if (explicitDemo && isApplicationPath(path)) {
    response.headers.set(CACHEABLE_DEMO_HEADER, "1");
    response.headers.append("Vary", "Cookie");
  }
  return response;
}
