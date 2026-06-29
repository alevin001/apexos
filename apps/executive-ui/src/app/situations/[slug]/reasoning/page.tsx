import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { SituationNav } from "@/components/SituationNav";
import { MarkdownBody } from "@/components/Section";
import { getSituationBySlug } from "@/services/pipeline-service";
import { getReasoningView } from "@/services/reasoning-service";
import type { ReasoningLayer, ReasoningView } from "@/types/executive";

export const dynamic = "force-dynamic";

const PIPELINE_ORDER: { key: keyof ReasoningView; label: string }[] = [
  { key: "evidence", label: "Evidence" },
  { key: "interpretation", label: "Interpretation" },
  { key: "assumptions", label: "Assumptions" },
  { key: "blindSpots", label: "Blind Spots" },
  { key: "confidence", label: "Confidence" },
  { key: "recommendations", label: "Recommendations" },
];

function ReasoningLayerBlock({ label, layers }: { label: string; layers: ReasoningLayer[] }) {
  return (
    <div className="reasoning-layer">
      <h3 className="reasoning-layer-title">{label}</h3>
      {layers.length === 0 ? (
        <p className="empty-state">No {label.toLowerCase()} artifacts</p>
      ) : (
        layers.map((layer) => (
          <article key={layer.external_id} className="artifact-card">
            <div className="artifact-card-header">
              <h4 style={{ margin: 0 }}>{layer.title}</h4>
              <span className="badge">{layer.status}</span>
            </div>
            <p className="artifact-meta">
              {layer.external_id} · {layer.type}
            </p>
            <MarkdownBody content={layer.body_md} />
          </article>
        ))
      )}
    </div>
  );
}

export default async function ReasoningPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const situation = await getSituationBySlug(slug);
  if (!situation) notFound();

  const reasoning = await getReasoningView(slug);

  return (
    <AppShell
      title={`Reasoning — ${situation.title}`}
      subtitle="Evidence → Interpretation → Assumptions → Blind Spots → Confidence → Recommendations"
    >
      <SituationNav slug={slug} />

      {!reasoning ? (
        <section className="section">
          <p className="empty-state">No interpretation package linked to this situation.</p>
        </section>
      ) : (
        <>
          {reasoning.packageSummary && (
            <section className="section">
              <h2 className="section-title">Interpretation Package</h2>
              <p className="list-item-meta">
                Confidence: {reasoning.packageSummary.confidence_summary}
                {reasoning.packageSummary.uncertainty_flags.length > 0 &&
                  ` · Uncertainty: ${reasoning.packageSummary.uncertainty_flags.join(", ")}`}
              </p>
            </section>
          )}

          <div className="reasoning-pipeline">
            {PIPELINE_ORDER.map(({ key, label }) => (
              <ReasoningLayerBlock
                key={key}
                label={label}
                layers={reasoning[key] as ReasoningLayer[]}
              />
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
