import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  {
    cwd: root,
    encoding: "utf8",
  },
)
  .split("\n")
  .filter(Boolean)
  .filter((file) => !file.endsWith("package-lock.json"));

const patterns = [
  { name: "Supabase secret key", expression: /sb_secret_[A-Za-z0-9_-]{20,}/g },
  {
    name: "service-role assignment",
    expression: /SUPABASE_SERVICE_ROLE(?:_KEY)?\s*=\s*[^\s#]+/g,
  },
  {
    name: "OpenAI-style secret",
    expression: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/g,
  },
  {
    name: "private key",
    expression: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
];

const findings = [];
for (const file of files) {
  let source;
  try {
    source = readFileSync(resolve(root, file), "utf8");
  } catch {
    continue;
  }
  for (const pattern of patterns) {
    if (pattern.expression.test(source))
      findings.push(`${file}: ${pattern.name}`);
    pattern.expression.lastIndex = 0;
  }
}

if (findings.length) {
  console.error(`Secret scan failed (${findings.length} findings):`);
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}
console.log(`Secret scan passed: ${files.length} repository files inspected.`);
