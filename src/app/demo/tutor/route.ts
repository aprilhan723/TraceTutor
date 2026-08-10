import { NextResponse } from "next/server";
import { DEMO_MODE_COOKIE } from "@/lib/runtime-mode";

export function GET() {
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/tutor/dashboard" },
  });
  response.cookies.set(DEMO_MODE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 24 * 60 * 60,
  });
  return response;
}
