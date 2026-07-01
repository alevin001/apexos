import { executePipeline, executePipelineDry } from "../pipeline/orchestrator.js";
import { RuntimeError } from "../shared/errors.js";

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      args["dry-run"] = true;
    } else if (arg.startsWith("--") && i + 1 < argv.length) {
      args[arg.slice(2)] = argv[++i];
    }
  }
  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const message = args.message as string | undefined;
  const situation = args.situation as string | undefined;
  const dryRun = args["dry-run"] === true;

  if (!message) {
    console.error("Usage: npm run execute -- --message \"Your question\" [--situation slug] [--dry-run]");
    process.exit(1);
  }

  const request = {
    message,
    situationSlug: situation,
  };

  try {
    if (dryRun) {
      console.log("=== ApexOS Runtime — Context Package (Dry Run) ===\n");
      const ctx = await executePipelineDry(request);
      console.log("Stages:");
      for (const stage of ctx.stages) {
        console.log(`  [${stage.status}] ${stage.stage} (${stage.durationMs}ms) — ${stage.detail ?? ""}`);
      }
      console.log("\n--- Executive Context Package ---\n");
      console.log(ctx.contextPackage?.llmInstructions ?? "No context package assembled");
    } else {
      console.log("=== ApexOS Runtime — Execute Pipeline ===\n");
      const result = await executePipeline(request);
      console.log("Stages:");
      for (const stage of result.stages) {
        console.log(`  [${stage.status}] ${stage.stage} (${stage.durationMs}ms) — ${stage.detail ?? ""}`);
      }
      console.log("\n--- Response ---\n");
      console.log(result.response);
      console.log("\n--- Metadata ---");
      console.log(JSON.stringify(result.metadata, null, 2));
    }
  } catch (err) {
    if (err instanceof RuntimeError) {
      console.error(`\nRuntime error [${err.code}] at ${err.stage ?? "unknown"}: ${err.message}`);
    } else {
      console.error("\nError:", err instanceof Error ? err.message : err);
    }
    process.exit(1);
  }
}

main();
