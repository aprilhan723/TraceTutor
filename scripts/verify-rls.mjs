import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const migrationsDirectory = resolve(root, "supabase/migrations");
const source = readdirSync(migrationsDirectory)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(resolve(migrationsDirectory, file), "utf8"))
  .join("\n");

const tables = [...source.matchAll(/create table public\.([a-z_]+)\s*\(/g)].map(
  (match) => match[1],
);
const failures = [];

for (const table of tables) {
  if (
    !source.includes(`alter table public.${table} enable row level security;`)
  ) {
    failures.push(`${table}: RLS is not enabled`);
  }
  if (
    !new RegExp(`create policy [a-z0-9_]+\\s+on public\\.${table}\\s`).test(
      source,
    )
  ) {
    failures.push(`${table}: no explicit policy exists`);
  }
}

const requiredSensitiveRevocations = [
  "tutor_adjudications",
  "audit_logs",
  "attempts",
  "responses",
  "assignments",
  "assignment_items",
  "ai_diagnosis_suggestions",
  "daily_learner_progress",
  "learner_streak_stats",
  "study_activity_events",
];
for (const table of requiredSensitiveRevocations) {
  const mutationBlock =
    /revoke insert, update, delete on[\s\S]*?from authenticated;/g;
  const revoked = [...source.matchAll(mutationBlock)].some((match) =>
    match[0].includes(`public.${table}`),
  );
  if (!revoked)
    failures.push(`${table}: direct client mutation is not revoked`);
}

if (!source.includes("private.can_tutor_student")) {
  failures.push("linked tutor/student authorization helper is missing");
}
if (!source.includes("Published content must be versioned, not modified")) {
  failures.push("published content immutability trigger is missing");
}
if (failures.length) {
  console.error(`RLS verification failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `RLS verification passed: ${tables.length} exposed tables enabled, policy-covered, and sensitive mutation checks present.`,
);
