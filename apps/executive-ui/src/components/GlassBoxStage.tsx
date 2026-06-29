"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProvenanceStageData } from "@/types/executive";

function TransformationLog({ entries }: { entries: Record<string, unknown>[] }) {
  if (!entries.length) return null;
  return (
    <div className="provenance-log">
      <h5>Transformation Log</h5>
      <ul>
        {entries.map((entry, i) => (
          <li key={i}>
            <span className="log-date">{String(entry.date ?? "")}</span>
            <span className="log-action">{String(entry.action ?? "")}</span>
            {entry.rationale != null && (
              <span className="log-rationale"> — {String(entry.rationale)}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StageArtifacts({ artifacts }: { artifacts: ProvenanceStageData["artifacts"] }) {
  if (!artifacts.length) return null;
  return (
    <div className="provenance-artifacts">
      <h5>Component Artifacts ({artifacts.length})</h5>
      {artifacts.map((a) => (
        <details key={a.external_id} className="artifact-detail">
          <summary>
            <code>{a.external_id}</code> — {a.title}
            {a.type && <span className="badge">{a.type}</span>}
          </summary>
          {a.body_md && <pre className="markdown-body">{a.body_md}</pre>}
        </details>
      ))}
    </div>
  );
}

export function GlassBoxStage({ stage, defaultExpanded = false }: { stage: ProvenanceStageData; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <article className={`glass-box-stage ${stage.complete ? "complete" : "pending"} ${expanded ? "expanded" : ""}`}>
      <button
        type="button"
        className="glass-box-stage-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="stage-indicator">
          <span className="stage-number">{stage.label.charAt(0)}</span>
        </div>
        <div className="stage-header-content">
          <div className="stage-header-top">
            <h3>{stage.label}</h3>
            <span className={`stage-status-badge ${stage.complete ? "complete" : "pending"}`}>
              {stage.status}
            </span>
          </div>
          <p className="stage-summary">{stage.summary}</p>
          <code className="stage-external-id">{stage.externalId}</code>
        </div>
        <span className="expand-icon">{expanded ? "−" : "+"}</span>
      </button>

      {expanded && (
        <div className="glass-box-stage-body">
          <div className="provenance-insights">
            <h4>Explainability</h4>
            <dl className="insight-list">
              {stage.insights.map((insight) => (
                <div key={insight.question} className="insight-item">
                  <dt>{insight.question}</dt>
                  <dd>{insight.answer}</dd>
                </div>
              ))}
            </dl>
          </div>

          {stage.body_md && (
            <div className="provenance-body">
              <h5>Artifact Content</h5>
              <pre className="markdown-body">{stage.body_md}</pre>
            </div>
          )}

          <StageArtifacts artifacts={stage.artifacts} />
          <TransformationLog entries={stage.transformation_log ?? []} />

          {stage.relatedPath && (
            <Link href={stage.relatedPath} className="stage-deep-link">
              Inspect in detail →
            </Link>
          )}
        </div>
      )}
    </article>
  );
}

export function DecisionProvenancePipeline({
  stages,
  highlightStage,
}: {
  stages: ProvenanceStageData[];
  highlightStage?: string;
}) {
  return (
    <div className="glass-box-pipeline">
      {stages.map((stage, i) => (
        <div key={stage.id} className="glass-box-stage-wrapper">
          <GlassBoxStage
            stage={stage}
            defaultExpanded={highlightStage === stage.id || (i === stages.length - 1 && stage.complete)}
          />
          {i < stages.length - 1 && <div className="pipeline-connector" aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
}
