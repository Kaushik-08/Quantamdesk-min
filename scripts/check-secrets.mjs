#!/usr/bin/env node
/**
 * Pre-push secret scan — fails if tracked files contain API keys or .env is staged.
 * Run: npm run security:check
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const FAILURES = [];

const SECRET_PATTERNS = [
  { name: "OpenAI API key", regex: /sk-(proj-)?[A-Za-z0-9_-]{20,}/ },
  { name: "Generic API key assignment", regex: /(?:api[_-]?key|secret|token)\s*=\s*["'][^"'\s]{8,}["']/i },
  { name: "PostgreSQL URL with password", regex: /postgresql:\/\/[^:]+:[^@\s]+@/ },
];

function git(args) {
  try {
    return execSync(`git ${args}`, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

// 1. Ensure .env is gitignored and not staged
const gitignore = existsSync(join(ROOT, ".gitignore"))
  ? readFileSync(join(ROOT, ".gitignore"), "utf8")
  : "";

if (!gitignore.includes(".env")) {
  FAILURES.push(".gitignore must include `.env`");
}

const staged = git("diff --cached --name-only");
if (staged.split("\n").filter(Boolean).some((f) => f === ".env" || f.endsWith(".env"))) {
  FAILURES.push("`.env` is staged for commit — remove it with `git reset HEAD .env`");
}

// 2. Scan tracked files for secret patterns
const tracked = git("ls-files").split("\n").filter(Boolean);
const skip = [".env.example", "scripts/check-secrets.mjs", "README.md", "DESIGN.md"];

for (const file of tracked) {
  if (skip.some((s) => file === s || file.endsWith(s))) continue;
  const fullPath = join(ROOT, file);
  if (!existsSync(fullPath)) continue;
  const content = readFileSync(fullPath, "utf8");
  for (const { name, regex } of SECRET_PATTERNS) {
    if (regex.test(content)) {
      FAILURES.push(`${file}: possible ${name} detected`);
    }
  }
}

// 3. Warn if .env exists locally (informational, not a failure)
if (existsSync(join(ROOT, ".env"))) {
  console.log("ℹ  Local `.env` found (correct — it should stay untracked).");
}

if (FAILURES.length > 0) {
  console.error("\n❌ Security check failed:\n");
  for (const f of FAILURES) console.error(`  • ${f}`);
  console.error("\nFix issues before pushing to GitHub.\n");
  process.exit(1);
}

console.log("✅ Security check passed — no secrets detected in tracked files.");
