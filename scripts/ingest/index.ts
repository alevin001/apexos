import { ingestScenario } from "./pipeline.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const scenarioIdx = args.indexOf("--scenario");
  const scenario = scenarioIdx >= 0 ? args[scenarioIdx + 1] : "leadership-conflict-q2";

  console.log(`ApexOS Ingestion — scenario: ${scenario}`);
  const report = await ingestScenario(scenario);

  console.log(`\nIngestion complete:`);
  console.log(`  Ingested: ${report.ingested}`);
  console.log(`  Skipped (integrity): ${report.skipped}`);
  console.log(`  Errors: ${report.errors.length}`);

  if (report.errors.length > 0) {
    report.errors.forEach((e) => console.error(`  ERROR: ${e}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
