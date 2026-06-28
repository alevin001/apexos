import { getSupabase } from "../shared/supabase.js";
import type { ValidationResult } from "../shared/types.js";
import { queryTraceabilityChainDirect } from "./traceability.js";
import { isTerminalStatus } from "../ingest/integrity.js";

export async function runValidationSuite(
  contextSpecId = "CTX-PKG-001"
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const supabase = getSupabase();

  const chain = await queryTraceabilityChainDirect(contextSpecId);
  results.push({
    check: "pipeline_chain_complete",
    passed: !!chain && !!chain.validation,
    detail: chain
      ? `Chain: ${chain.context_spec} → ... → ${chain.validation}${chain.learning ? ` → ${chain.learning}` : ""}`
      : "Full FK chain not found",
  });

  if (chain) {
    const expected = [
      "CTX-PKG-001",
      "RET-REQ-001",
      "RET-EVD-001",
      "RET-CTX-001",
      "INF-INT-001",
      "REC-PKG-001",
      "OUT-CAP-001",
      "OUT-VAL-001",
    ];
    const actual = [
      chain.context_spec,
      chain.retrieval_request,
      chain.evidence_package,
      chain.context_package,
      chain.interpretation,
      chain.recommendation,
      chain.outcome_capture,
      chain.validation,
    ];
    const idsMatch = expected.every((id, i) => actual[i] === id);
    results.push({
      check: "scenario_external_ids",
      passed: idsMatch,
      detail: idsMatch ? "All scenario external IDs match" : `Expected ${expected.join(" → ")}, got ${actual.join(" → ")}`,
    });
  }

  const { count: registryCount } = await supabase
    .from("artifact_registry")
    .select("*", { count: "exact", head: true });

  results.push({
    check: "artifact_registry_populated",
    passed: (registryCount ?? 0) >= 15,
    detail: `artifact_registry count: ${registryCount ?? 0}`,
  });

  const { data: orphanLinks } = await supabase.rpc("count_orphan_links").maybeSingle();
  const orphanCount = orphanLinks ?? 0;

  if (typeof orphanCount === "number") {
    results.push({
      check: "no_orphan_links",
      passed: orphanCount === 0,
      detail: `Orphan links: ${orphanCount}`,
    });
  } else {
    const { data: links } = await supabase.from("artifact_links").select("target_id, target_table");
    const { data: reg } = await supabase.from("artifact_registry").select("record_id, table_name");
    const regSet = new Set((reg ?? []).map((r) => `${r.table_name}:${r.record_id}`));
    const orphans = (links ?? []).filter((l) => !regSet.has(`${l.target_table}:${l.target_id}`));
    results.push({
      check: "no_orphan_links",
      passed: orphans.length === 0,
      detail: `Orphan links: ${orphans.length}`,
    });
  }

  const { data: ks } = await supabase
    .from("knowledge_sources")
    .select("external_id, storage_object_path")
    .eq("external_id", "SRC-001")
    .maybeSingle();

  results.push({
    check: "knowledge_storage_linked",
    passed: !!ks?.storage_object_path,
    detail: ks?.storage_object_path
      ? `Storage path: ${ks.storage_object_path}`
      : "SRC-001 missing storage_object_path (upload during ingestion)",
  });

  const { data: recPkg } = await supabase
    .from("recommendation_packages")
    .select("status")
    .eq("external_id", "REC-PKG-001")
    .maybeSingle();

  results.push({
    check: "recommendation_delivered_not_decision",
    passed: recPkg?.status === "delivered",
    detail: "Recommendation delivered; executive decision stored only on outcome capture as external reference",
  });

  const { data: outCap } = await supabase
    .from("outcome_captures")
    .select("executive_decision_reference")
    .eq("external_id", "OUT-CAP-001")
    .maybeSingle();

  results.push({
    check: "executive_decision_external",
    passed: outCap?.executive_decision_reference === "DEC-EXT-2026-Q2-001",
    detail: `Executive decision reference: ${outCap?.executive_decision_reference ?? "missing"}`,
  });

  const { data: learning } = await supabase
    .from("learning_updates")
    .select("promotion_status, status")
    .eq("external_id", "OUT-LRN-001")
    .maybeSingle();

  results.push({
    check: "learning_creates_new_record",
    passed: learning?.promotion_status === "pending" && learning?.status === "validated",
    detail: "Learning update pending promotion — does not rewrite history",
  });

  if (chain?.validation) {
    const { data: vp } = await supabase
      .from("validation_packages")
      .select("status")
      .eq("external_id", chain.validation)
      .maybeSingle();

    results.push({
      check: "historical_integrity_terminal",
      passed: isTerminalStatus(vp?.status),
      detail: `Validation package status: ${vp?.status}`,
    });
  }

  return results;
}

export function printValidationResults(results: ValidationResult[]): boolean {
  let allPassed = true;
  console.log("\n=== Executive Loop Validation ===\n");
  for (const r of results) {
    const icon = r.passed ? "PASS" : "FAIL";
    console.log(`[${icon}] ${r.check}`);
    console.log(`       ${r.detail}\n`);
    if (!r.passed) allPassed = false;
  }
  console.log(allPassed ? "All validations PASSED" : "Some validations FAILED");
  return allPassed;
}

async function main(): Promise<void> {
  const contextSpecId = process.argv[2] ?? "CTX-PKG-001";
  const results = await runValidationSuite(contextSpecId);
  const passed = printValidationResults(results);
  process.exit(passed ? 0 : 1);
}

function isDirectExecution(): boolean {
  const entry = process.argv[1]?.replace(/\\/g, "/") ?? "";
  return import.meta.url === `file:///${entry}` || import.meta.url.endsWith(entry);
}

if (isDirectExecution()) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
