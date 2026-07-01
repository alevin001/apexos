/**
 * Windows TLS bootstrap — tsx spawns child Node processes that do not inherit
 * the --use-system-ca CLI flag. NODE_OPTIONS propagates to all Node processes.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsxCli = join(__dirname, "node_modules/tsx/dist/cli.mjs");
const args = process.argv.slice(2);

const nodeOptions = process.env.NODE_OPTIONS ?? "";
const env = {
  ...process.env,
  NODE_OPTIONS: nodeOptions.includes("use-system-ca")
    ? nodeOptions
    : `${nodeOptions} --use-system-ca`.trim(),
};

const result = spawnSync(process.execPath, [tsxCli, "src/" + args[0], ...args.slice(1)], {
  stdio: "inherit",
  env,
  shell: false,
});

process.exit(result.status ?? 1);
