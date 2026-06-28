import { ingestScenario } from "../ingest/pipeline.js";
import { queryTraceabilityChainDirect } from "./traceability.js";
import { runValidationSuite, printValidationResults } from "./validation.js";
import { runAllReviews, printReviewResults } from "./reviews.js";

export async function runExecutiveLoop(scenarioSlug: string): Promise<boolean> {
  console.log("=".repeat(60));
  console.log("ApexOS Build 09 — Executive Loop");
  console.log("=".repeat(60));

  console.log("\n[1/4] Ingestion — repository → Supabase");
  const ingestReport = await ingestScenario(scenarioSlug);
  console.log(`  Ingested: ${ingestReport.ingested}, Skipped: ${ingestReport.skipped}, Errors: ${ingestReport.errors.length}`);

  if (ingestReport.errors.length > 0) {
    ingestReport.errors.forEach((e) => console.error(`  ERROR: ${e}`));
    return false;
  }

  console.log("\n[2/4] Traceability — verify FK chain");
  const chain = await queryTraceabilityChainDirect("CTX-PKG-001");
  if (!chain) {
    console.error("  FAIL: Traceability chain not found");
    return false;
  }
  console.log("  Chain:", Object.values(chain).filter(Boolean).join(" → "));

  console.log("\n[3/4] Validation — executive loop checks");
  const validationResults = await runValidationSuite("CTX-PKG-001");
  const validationPassed = printValidationResults(validationResults);

  console.log("\n[4/4] Reviews — architecture fidelity and build acceptance");
  const reviews = await runAllReviews(chain);
  const reviewsPassed = printReviewResults(reviews);

  const allPassed = validationPassed && reviewsPassed;
  console.log("\n" + "=".repeat(60));
  console.log(allPassed ? "EXECUTIVE LOOP: PASS" : "EXECUTIVE LOOP: FAIL");
  console.log("=".repeat(60));

  return allPassed;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const scenarioIdx = args.indexOf("--scenario");
  const scenario = scenarioIdx >= 0 ? args[scenarioIdx + 1] : "leadership-conflict-q2";

  const passed = await runExecutiveLoop(scenario);
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
