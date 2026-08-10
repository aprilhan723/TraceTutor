import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const core = readFileSync(
  resolve(root, "supabase/migrations/202608100001_phase6_core.sql"),
  "utf8",
);
const security = readFileSync(
  resolve(root, "supabase/migrations/202608100002_phase6_security.sql"),
  "utf8",
);

const tables = [...core.matchAll(/create table public\.([a-z_]+)\s*\(/g)].map(
  (match) => match[1],
);
const failures = [];

for (const table of tables) {
  if (
    !security.includes(`alter table public.${table} enable row level security;`)
  ) {
    failures.push(`${table}: RLS is not enabled`);
  }
  if (
    !new RegExp(`create policy [a-z0-9_]+ on public\\.${table} `).test(security)
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
];
for (const table of requiredSensitiveRevocations) {
  const mutationBlock =
    /revoke insert, update, delete on[\s\S]*?from authenticated;/g;
  const revoked = [...security.matchAll(mutationBlock)].some((match) =>
    match[0].includes(`public.${table}`),
  );
  if (!revoked)
    failures.push(`${table}: direct client mutation is not revoked`);
}

if (!security.includes("private.can_tutor_student")) {
  failures.push("linked tutor/student authorization helper is missing");
}
if (!core.includes("Published content must be versioned, not modified")) {
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
