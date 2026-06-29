import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { SituationNav } from "@/components/SituationNav";
import { DecisionForm } from "@/components/DecisionForm";
import { MarkdownBody } from "@/components/Section";
import { getSituationPipeline } from "@/services/pipeline-service";
import { getDecisionForRecommendation } from "@/services/decision-service";
import { isTerminalStatus } from "@/services/supabase-server";

export const dynamic = "force-dynamic";

export default async function DecisionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pipeline = await getSituationPipeline(slug);
  if (!pipeline) notFound();

  const recPkg = pipeline.recommendationPackage;
  if (!recPkg) {
    return (
      <AppShell title={`Decision — ${pipeline.situation.title}`}>
        <SituationNav slug={slug} />
        <section className="section">
          <p className="empty-state">No recommendation available for decision capture.</p>
        </section>
      </AppShell>
    );
  }

  const existing = await getDecisionForRecommendation(recPkg.id as string);
  const isTerminal = pipeline.outcomeCapture
    ? isTerminalStatus(pipeline.outcomeCapture.status as string)
    : false;

  return (
    <AppShell
      title={`Decision — ${pipeline.situation.title}`}
      subtitle="Record executive response to recommendation"
    >
      <SituationNav slug={slug} />

      <section className="section">
        <h2 className="section-title">Recommendation Under Review</h2>
        <p className="list-item-meta">
          {(recPkg.external_id as string) ?? ""} · {recPkg.confidence_summary as string}
        </p>
        <MarkdownBody content={recPkg.body_md as string} />
      </section>

      <DecisionForm
        recommendationPackageId={recPkg.id as string}
        existingDecision={existing}
        isTerminal={isTerminal}
      />
    </AppShell>
  );
}
