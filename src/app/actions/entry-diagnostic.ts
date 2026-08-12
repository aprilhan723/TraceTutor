"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAccountRole } from "@/auth/access";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { entryReadingDiagnosticItemIds } from "@/services/entry-reading-diagnostic";

const responseSchema = z.object({
  itemId: z.enum(entryReadingDiagnosticItemIds),
  response: z.string().trim().min(1).max(120),
  confidence: z.enum(["guessing", "think-so", "certain"]),
  elapsedSeconds: z.number().int().min(0).max(900),
});

const submissionSchema = z.object({
  idempotencyKey: z.uuid(),
  targetTestDate: z.iso.date(),
  responses: z.array(responseSchema).length(6),
});

export interface EntryDiagnosticActionState {
  status: "idle" | "error";
  message: string;
}

export async function submitReadingEntryDiagnosticAction(
  _previous: EntryDiagnosticActionState,
  formData: FormData,
): Promise<EntryDiagnosticActionState> {
  await requireAccountRole("student");
  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return {
      status: "error",
      message: "The diagnostic response is malformed.",
    };
  }
  const parsed = submissionSchema.safeParse(payload);
  if (
    !parsed.success ||
    new Set(parsed.data.responses.map((row) => row.itemId)).size !== 6
  ) {
    return {
      status: "error",
      message:
        "Answer every item, choose confidence, and add a valid test date.",
    };
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const targetDate = new Date(`${parsed.data.targetTestDate}T00:00:00Z`);
  if (targetDate < today) {
    return {
      status: "error",
      message: "Target test date cannot be in the past.",
    };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("complete_reading_entry_diagnostic", {
    p_idempotency_key: parsed.data.idempotencyKey,
    p_target_test_date: parsed.data.targetTestDate,
    p_responses: parsed.data.responses as unknown as Json,
  });
  if (error) return { status: "error", message: error.message };
  redirect("/student/today?diagnostic=complete");
}
