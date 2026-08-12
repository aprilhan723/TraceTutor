import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAccountRole } from "@/auth/access";
import { EntryReadingDiagnostic } from "@/components/student/entry-reading-diagnostic";
import { isSupabaseRuntime } from "@/lib/runtime-mode";
import { getServerNow } from "@/lib/server-time";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getEntryReadingDiagnosticItems } from "@/services/entry-reading-diagnostic";

export const metadata: Metadata = { title: "Reading Entry Diagnostic" };

export default async function ReadingEntryDiagnosticPage() {
  if (!(await isSupabaseRuntime())) redirect("/student/today");
  const account = await requireAccountRole("student");
  if (!account) redirect("/auth/sign-in");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("entry_reading_diagnostics")
    .select("id")
    .eq("learner_id", account.userId)
    .limit(1)
    .maybeSingle();
  if (data) redirect("/student/today");
  return (
    <EntryReadingDiagnostic
      items={getEntryReadingDiagnosticItems()}
      minimumTargetDate={getServerNow().toISOString().slice(0, 10)}
    />
  );
}
