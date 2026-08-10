"use server";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  completeProfileSchema,
  getFormString,
  magicLinkSchema,
  signInSchema,
  signUpSchema,
  tutorWorkspaceSchema,
} from "@/auth/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_MODE_COOKIE } from "@/lib/runtime-mode";

export interface AuthActionState {
  status: "idle" | "error" | "success";
  message: string;
  fields?: Record<string, string[]>;
}

function actionError(message: string, fields?: Record<string, string[]>) {
  return { status: "error" as const, message, fields };
}

function appOrigin() {
  const candidate = process.env.NEXT_PUBLIC_APP_URL?.trim();
  try {
    return new URL(candidate || "http://localhost:3000").origin;
  } catch {
    return "http://localhost:3000";
  }
}

function authMessage(message: string) {
  const safeMessages = new Set([
    "Invalid login credentials",
    "Email not confirmed",
    "User already registered",
  ]);
  return safeMessages.has(message)
    ? message
    : "The authentication request could not be completed. Please try again.";
}

export async function signInAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: getFormString(formData, "email"),
    password: getFormString(formData, "password"),
  });
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors,
    );
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return actionError(authMessage(error.message));
  (await cookies()).delete(DEMO_MODE_COOKIE);
  redirect("/auth/continue");
}

export async function signUpAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    email: getFormString(formData, "email"),
    password: getFormString(formData, "password"),
    displayName: getFormString(formData, "displayName"),
  });
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors,
    );
  }
  const invite = getFormString(formData, "invite");
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_MODE_COOKIE);
  if (invite) {
    cookieStore.set("tt_invite", invite, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60,
    });
  }
  cookieStore.set("tt_display_name", parsed.data.displayName, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${appOrigin()}/auth/confirm` },
  });
  if (error) return actionError(authMessage(error.message));
  (await cookies()).delete(DEMO_MODE_COOKIE);
  return {
    status: "success",
    message: "Check your email to confirm the account, then continue here.",
  };
}

export async function magicLinkAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = magicLinkSchema.safeParse({
    email: getFormString(formData, "magicEmail"),
  });
  if (!parsed.success) {
    return actionError(
      "Enter a valid email address.",
      parsed.error.flatten().fieldErrors,
    );
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${appOrigin()}/auth/confirm`,
    },
  });
  if (error) return actionError(authMessage(error.message));
  (await cookies()).delete(DEMO_MODE_COOKIE);
  return {
    status: "success",
    message: "Check your email for a secure sign-in link.",
  };
}

export async function completeProfileAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const cookieStore = await cookies();
  const parsed = completeProfileSchema.safeParse({
    displayName: getFormString(formData, "displayName"),
    role: getFormString(formData, "role"),
    inviteToken:
      getFormString(formData, "inviteToken") ||
      cookieStore.get("tt_invite")?.value,
  });
  if (!parsed.success) {
    return actionError(
      "Choose the account path and complete the required fields.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claims?.claims.sub) {
    return actionError("Your sign-in has expired. Please sign in again.");
  }

  if (parsed.data.role === "tutor") {
    const { error } = await supabase.rpc("create_tutor_profile", {
      p_display_name: parsed.data.displayName,
    });
    if (error) return actionError(error.message);
    cookieStore.delete("tt_display_name");
    redirect("/auth/setup");
  }

  if (!parsed.data.inviteToken) {
    return actionError(
      "A valid tutor invitation is required for a student account.",
    );
  }
  const tokenHash = createHash("sha256")
    .update(parsed.data.inviteToken)
    .digest("hex");
  const { error } = await supabase.rpc("accept_student_invite", {
    p_token_hash: tokenHash,
    p_display_name: parsed.data.displayName,
  });
  if (error) return actionError(error.message);
  cookieStore.delete("tt_invite");
  cookieStore.delete("tt_display_name");
  redirect("/student/today");
}

export async function createTutorWorkspaceAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = tutorWorkspaceSchema.safeParse({
    organizationName: getFormString(formData, "organizationName"),
    className: getFormString(formData, "className"),
  });
  if (!parsed.success) {
    return actionError(
      "Name both the workspace and class.",
      parsed.error.flatten().fieldErrors,
    );
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_tutor_workspace", {
    p_organization_name: parsed.data.organizationName,
    p_class_name: parsed.data.className,
  });
  if (error) return actionError(error.message);
  redirect("/tutor/dashboard");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  (await cookies()).delete(DEMO_MODE_COOKIE);
  redirect("/auth/sign-in");
}
