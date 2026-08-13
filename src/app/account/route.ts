import { NextResponse, type NextRequest } from "next/server";
import { DEMO_MODE_COOKIE } from "@/lib/runtime-mode";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/auth/continue", request.url),
    303,
  );
  response.cookies.set(DEMO_MODE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
