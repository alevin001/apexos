import type { RuntimeObservability } from "@/types/executive";

export function RuntimeObservabilityBar({ metrics }: { metrics: RuntimeObservability }) {
  return (
    <div className="observability-bar" role="status" aria-label="Runtime observability">
      <div className="observability-header">
        <span className="observability-title">Runtime Status</span>
        <span className={`observability-pipeline-status status-${metrics.pipelineStatus}`}>
          {metrics.pipelineStatus === "complete"
            ? "Pipeline Complete"
            : metrics.pipelineStatus === "partial"
              ? `Stage: ${metrics.currentStage}`
              : "No Pipeline"}
        </span>
      </div>
      <div className="observability-metrics">
        <Metric label="Situation" value={metrics.activeSituation} />
        <Metric label="Context" value={String(metrics.contextCount)} />
        <Metric label="Evidence" value={String(metrics.evidenceCount)} />
        <Metric label="Contradictions" value={String(metrics.contradictoryEvidenceCount)} />
        <Metric label="Assumptions" value={String(metrics.assumptionCount)} />
        <Metric
          label="Interpretation"
          value={metrics.interpretationConfidence ?? "—"}
        />
        <Metric
          label="Recommendation"
          value={metrics.recommendationConfidence ?? "—"}
        />
        <Metric
          label="Progress"
          value={`${metrics.completedStages}/${metrics.totalStages}`}
        />
      </div>
      {metrics.uncertaintyFlags.length > 0 && (
        <div className="observability-flags">
          <span className="flags-label">Uncertainty:</span>
          {metrics.uncertaintyFlags.map((flag) => (
            <span key={flag} className="uncertainty-flag">
              {flag.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="observability-metric">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  );
}
