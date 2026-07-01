import { GovernanceValidationError } from "../../shared/errors.js";
import type { GovernanceCheck, GovernanceConstraints } from "../../types/context-package.js";
import type { PipelineContext } from "../../types/pipeline.js";

const FIDELITY_RULES = [
  "Evidence precedes inference — LLM receives assembled context only",
  "Doctrine governs orchestration — no runtime reasoning without context package",
  "Recommendations do not equal decisions — executive retains agency",
  "Transparency available — pipeline traceable via Glass Box",
];

const DRIFT_PROTECTION = [
  "Do not fabricate evidence not present in the context package",
  "Do not override governance constraints in responses",
  "Do not claim outcome validation without recorded outcomes",
];

/**
 * Governance Validation — enforces structural and fidelity checks before LLM invocation.
 * Executes checklist validation; does not perform executive reasoning.
 */
export async function governanceValidationStage(ctx: PipelineContext): Promise<PipelineContext> {
  const start = Date.now();
  const checks: GovernanceCheck[] = [];

  checks.push({
    check: "Executive identity resolved",
    passed: !!ctx.executive,
    detail: ctx.executive?.slug,
  });

  checks.push({
    check: "Executive message present",
    passed: ctx.request.message.length > 0,
  });

  if (ctx.situation) {
    checks.push({
      check: "Situation record valid",
      passed: true,
      detail: ctx.situation.slug,
    });
  }

  if (ctx.contextRelevance) {
    checks.push({
      check: "Context relevance spec loaded",
      passed: true,
      detail: ctx.contextRelevance.externalId,
    });
  }

  if (ctx.evidence?.assembledContextPackage) {
    checks.push({
      check: "Assembled context package present",
      passed: true,
      detail: ctx.evidence.assembledContextPackage.externalId,
    });
  } else if (ctx.situation) {
    checks.push({
      check: "Assembled context package present",
      passed: false,
      detail: "No assembled context package — proceeding with memory-only context",
    });
  }

  checks.push({
    check: "Memory retrieval completed",
    passed: !!ctx.memory,
  });

  const violations = checks.filter((c) => !c.passed).map((c) => c.check);

  const criticalViolations = violations.filter(
    (v) => v !== "Assembled context package present"
  );

  if (criticalViolations.length > 0) {
    throw new GovernanceValidationError(
      `Governance validation failed: ${criticalViolations.join(", ")}`,
      criticalViolations
    );
  }

  const doctrineReferences = [
    "DOC-001 Project Charter — executive agency preserved",
    "DOC-006 Governance Architecture — fidelity and traceability",
    "TECH-002 Runtime Integration — context precedes reasoning",
  ];

  ctx.governance = {
    doctrineReferences,
    fidelityRules: FIDELITY_RULES,
    traceabilityRequired: true,
    driftProtection: DRIFT_PROTECTION,
    validationResults: checks,
  };

  ctx.stages.push({
    stage: "governance-validation",
    status: "success",
    durationMs: Date.now() - start,
    detail: `${checks.filter((c) => c.passed).length}/${checks.length} checks passed`,
  });

  return ctx;
}
