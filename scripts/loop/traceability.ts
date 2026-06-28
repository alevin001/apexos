import { getSupabase } from "../shared/supabase.js";
import type { TraceabilityChain } from "../shared/types.js";

const PIPELINE_QUERY = `
SELECT
  crs.external_id AS context_spec,
  crs.repository_path AS context_spec_path,
  rr.external_id AS retrieval_request,
  rr.repository_path AS retrieval_request_path,
  ep.external_id AS evidence_package,
  ep.repository_path AS evidence_package_path,
  acp.external_id AS context_package,
  acp.repository_path AS context_package_path,
  ip.external_id AS interpretation,
  ip.repository_path AS interpretation_path,
  rp.external_id AS recommendation,
  rp.repository_path AS recommendation_path,
  oc.external_id AS outcome_capture,
  oc.repository_path AS outcome_capture_path,
  vp.external_id AS validation,
  vp.repository_path AS validation_path,
  lu.external_id AS learning,
  lu.repository_path AS learning_path
FROM context_relevance_specs crs
JOIN retrieval_requests rr ON rr.context_reference_id = crs.id
JOIN evidence_packages ep ON ep.retrieval_request_id = rr.id
JOIN assembled_context_packages acp ON acp.retrieval_request_id = rr.id
JOIN interpretation_packages ip ON ip.assembled_context_package_id = acp.id
JOIN recommendation_packages rp ON rp.interpretation_package_id = ip.id
JOIN outcome_captures oc ON oc.recommendation_package_id = rp.id
JOIN validation_packages vp ON vp.outcome_capture_id = oc.id
LEFT JOIN learning_updates lu ON lu.validation_package_id = vp.id
WHERE crs.external_id = $1
LIMIT 1;
`;

export async function queryTraceabilityChain(
  contextSpecId = "CTX-PKG-001"
): Promise<TraceabilityChain | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("exec_sql", { query: PIPELINE_QUERY, params: [contextSpecId] });

  if (error) {
    return queryTraceabilityChainFallback(contextSpecId);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return row as TraceabilityChain | null;
}

async function queryTraceabilityChainFallback(
  contextSpecId: string
): Promise<TraceabilityChain | null> {
  const supabase = getSupabase();

  const { data: crs } = await supabase
    .from("context_relevance_specs")
    .select("id, external_id, repository_path")
    .eq("external_id", contextSpecId)
    .maybeSingle();

  if (!crs) return null;

  const { data: rr } = await supabase
    .from("retrieval_requests")
    .select("id, external_id, repository_path")
    .eq("context_reference_id", crs.id)
    .maybeSingle();

  if (!rr) return null;

  const { data: ep } = await supabase
    .from("evidence_packages")
    .select("external_id, repository_path")
    .eq("retrieval_request_id", rr.id)
    .maybeSingle();

  const { data: acp } = await supabase
    .from("assembled_context_packages")
    .select("id, external_id, repository_path")
    .eq("retrieval_request_id", rr.id)
    .maybeSingle();

  if (!acp) return null;

  const { data: ip } = await supabase
    .from("interpretation_packages")
    .select("id, external_id, repository_path")
    .eq("assembled_context_package_id", acp.id)
    .maybeSingle();

  if (!ip) return null;

  const { data: rp } = await supabase
    .from("recommendation_packages")
    .select("id, external_id, repository_path")
    .eq("interpretation_package_id", ip.id)
    .maybeSingle();

  if (!rp) return null;

  const { data: oc } = await supabase
    .from("outcome_captures")
    .select("id, external_id, repository_path")
    .eq("recommendation_package_id", rp.id)
    .maybeSingle();

  if (!oc) return null;

  const { data: vp } = await supabase
    .from("validation_packages")
    .select("id, external_id, repository_path")
    .eq("outcome_capture_id", oc.id)
    .maybeSingle();

  if (!vp) return null;

  const { data: lu } = await supabase
    .from("learning_updates")
    .select("external_id, repository_path")
    .eq("validation_package_id", vp.id)
    .maybeSingle();

  return {
    context_spec: crs.external_id,
    retrieval_request: rr.external_id,
    evidence_package: ep?.external_id ?? "",
    context_package: acp.external_id,
    interpretation: ip.external_id,
    recommendation: rp.external_id,
    outcome_capture: oc.external_id,
    validation: vp.external_id,
    learning: lu?.external_id ?? "",
  };
}

export async function verifyRepositoryTraceability(
  chain: TraceabilityChain
): Promise<{ artifact: string; hasRepositoryPath: boolean }[]> {
  const supabase = getSupabase();
  const checks: { table: string; externalId: string; label: string }[] = [
    { table: "context_relevance_specs", externalId: chain.context_spec, label: "context_spec" },
    { table: "retrieval_requests", externalId: chain.retrieval_request, label: "retrieval_request" },
    { table: "evidence_packages", externalId: chain.evidence_package, label: "evidence_package" },
    { table: "assembled_context_packages", externalId: chain.context_package, label: "context_package" },
    { table: "interpretation_packages", externalId: chain.interpretation, label: "interpretation" },
    { table: "recommendation_packages", externalId: chain.recommendation, label: "recommendation" },
    { table: "outcome_captures", externalId: chain.outcome_capture, label: "outcome_capture" },
    { table: "validation_packages", externalId: chain.validation, label: "validation" },
  ];

  if (chain.learning) {
    checks.push({ table: "learning_updates", externalId: chain.learning, label: "learning" });
  }

  const results: { artifact: string; hasRepositoryPath: boolean }[] = [];

  for (const check of checks) {
    const { data } = await supabase
      .from(check.table)
      .select("repository_path")
      .eq("external_id", check.externalId)
      .maybeSingle();

    results.push({
      artifact: check.label,
      hasRepositoryPath: !!data?.repository_path,
    });
  }

  return results;
}

async function main(): Promise<void> {
  const contextSpecId = process.argv[2] ?? "CTX-PKG-001";
  console.log(`Traceability query for ${contextSpecId}\n`);

  const chain = await queryTraceabilityChain(contextSpecId);
  if (!chain) {
    console.error("No traceability chain found.");
    process.exit(1);
  }

  console.log("Executive Loop Chain:");
  console.log(JSON.stringify(chain, null, 2));

  const repoChecks = await verifyRepositoryTraceability(chain);
  console.log("\nRepository path verification:");
  for (const c of repoChecks) {
    console.log(`  ${c.artifact}: ${c.hasRepositoryPath ? "PASS" : "FAIL"}`);
  }
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` || import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, "/") ?? "")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { queryTraceabilityChainFallback as queryTraceabilityChainDirect };
