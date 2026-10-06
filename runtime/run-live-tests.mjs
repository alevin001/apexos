/**
 * Build 19 live acceptance runner.
 * Sets APEXOS_LIVE_ACCEPTANCE=1 and Windows TLS (--use-system-ca) for child processes.
 * Does not mock providers. Missing credentials must fail inside the tests.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const nodeOptions = process.env.NODE_OPTIONS ?? "";
const env = {
  ...process.env,
  APEXOS_LIVE_ACCEPTANCE: "1",
  NODE_OPTIONS: nodeOptions.includes("use-system-ca")
    ? nodeOptions
    : `${nodeOptions} --use-system-ca`.trim(),
};

const files = [
  "src/knowledge/build19-checkpoint-d.test.ts",
  "src/knowledge/build19-checkpoint-f.test.ts",
  "src/knowledge/build19-checkpoint-g.test.ts",
];

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", "--test-name-pattern", "controlled live", ...files],
  {
    cwd: __dirname,
    env,
    stdio: "inherit",
    shell: false,
  }
);

process.exit(result.status ?? 1);
