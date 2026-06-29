import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { SituationNav } from "@/components/SituationNav";
import { ArchiveButton } from "@/components/ArchiveButton";
import { RuntimeObservabilityBar } from "@/components/RuntimeObservabilityBar";
import { PipelineStageBar, TraceLink, MarkdownBody } from "@/components/Section";
import { getSituationPipeline } from "@/services/pipeline-service";
import { getRuntimeObservability } from "@/services/provenance-service";

export const dynamic = "force-dynamic";

export default async function SituationOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [pipeline, observability] = await Promise.all([
    getSituationPipeline(slug),
    getRuntimeObservability(slug),
  ]);
  if (!pipeline) notFound();

  const { situation, chain, stages, contextSpec, recommendationPackage, outcomeCapture } = pipeline;

  return (
    <AppShell title={situation.title} subtitle={situation.situation_summary ?? undefined}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SituationNav slug={slug} />
        {situation.status !== "archived" && <ArchiveButton slug={slug} />}
      </div>

      {observability && <RuntimeObservabilityBar metrics={observability} />}

      <PipelineStageBar stages={stages} />

      {chain && (
        <section className="section glass-box-cta">
          <h2 className="section-title">Decision Provenance</h2>
          <p>
            Inspect the complete reasoning pipeline — why evidence was retrieved, what supports
            or contradicts conclusions, and how learning will occur.
          </p>
          <Link href={`/situations/${slug}/provenance`} className="glass-box-link">
            Open Glass Box →
          </Link>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">Situation</h2>
        <p>{situation.situation_summary}</p>
        <p className="list-item-meta">
          {situation.external_id} · {situation.status}
          {situation.situation_type && ` · ${situation.situation_type}`}
        </p>
      </section>

      {chain ? (
        <section className="section">
          <h2 className="section-title">Traceability Chain</h2>
          <div className="trace-chain">
            <TraceLink label="Context" value={chain.context_spec} />
            <TraceLink label="Retrieval" value={chain.retrieval_request} />
            <TraceLink label="Evidence" value={chain.evidence_package} />
            <TraceLink label="Context Pkg" value={chain.context_package} />
            <TraceLink label="Interpretation" value={chain.interpretation} />
            <TraceLink label="Recommendation" value={chain.recommendation} />
            <TraceLink label="Outcome" value={chain.outcome_capture} />
            <TraceLink label="Validation" value={chain.validation} />
            <TraceLink label="Learning" value={chain.learning} />
          </div>
        </section>
      ) : (
        <section className="section">
          <h2 className="section-title">Pipeline</h2>
          <p className="empty-state">
            No pipeline linked yet. Run the executive loop ingestion for this situation, or continue
            with repository artifact creation.
          </p>
        </section>
      )}

      {contextSpec && (
        <section className="section">
          <h2 className="section-title">Current Context</h2>
          <p>{contextSpec.situation_summary as string}</p>
          <MarkdownBody content={contextSpec.body_md as string} />
        </section>
      )}

      {recommendationPackage && (
        <section className="section">
          <h2 className="section-title">Current Recommendation</h2>
          <p className="list-item-meta">
            {(recommendationPackage.external_id as string) ?? ""} ·{" "}
            {recommendationPackage.confidence_summary as string}
          </p>
          <MarkdownBody content={recommendationPackage.body_md as string} />
        </section>
      )}

      {outcomeCapture && (
        <section className="section">
          <h2 className="section-title">Outcome Status</h2>
          <p>
            Decision: <code>{outcomeCapture.executive_decision_reference as string}</code>
          </p>
          <p>Status: {outcomeCapture.status as string}</p>
        </section>
      )}
    </AppShell>
  );
}
