/**
 * Back-compat wrapper. Prefer `npm run seed:demo`.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const child = spawn(
  "npx",
  ["--yes", "tsx", join(here, "run-seed.ts")],
  { stdio: "inherit", env: process.env },
);
child.on("exit", (code) => process.exit(code ?? 1));
