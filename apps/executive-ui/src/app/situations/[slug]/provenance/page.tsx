import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { SituationNav } from "@/components/SituationNav";
import { DecisionProvenancePipeline } from "@/components/GlassBoxStage";
import { RuntimeObservabilityBar } from "@/components/RuntimeObservabilityBar";
import { getDecisionProvenance, getRuntimeObservability } from "@/services/provenance-service";

export const dynamic = "force-dynamic";

export default async function ProvenancePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [provenance, observability] = await Promise.all([
    getDecisionProvenance(slug),
    getRuntimeObservability(slug),
  ]);

  if (!provenance) notFound();

  return (
    <AppShell
      title={`Glass Box — ${provenance.situationTitle}`}
      subtitle="Decision provenance — inspect every stage of reasoning from situation to learning"
    >
      <SituationNav slug={slug} />

      {observability && <RuntimeObservabilityBar metrics={observability} />}

      <section className="section glass-box-intro">
        <h2 className="section-title">Executive Glass Box</h2>
        <p>
          Every recommendation in ApexOS is traceable. Expand any stage below to inspect why
          information was retrieved, what evidence supports or contradicts conclusions, which
          assumptions exist, and how learning will occur after your decision.
        </p>
      </section>

      {provenance.stages.length === 0 ? (
        <section className="section">
          <p className="empty-state">
            No pipeline linked yet. Run the executive loop ingestion for this situation.
          </p>
        </section>
      ) : (
        <DecisionProvenancePipeline stages={provenance.stages} highlightStage="recommendation" />
      )}
    </AppShell>
  );
}
