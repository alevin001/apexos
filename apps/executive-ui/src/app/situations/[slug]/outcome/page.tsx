import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { SituationNav } from "@/components/SituationNav";
import { OutcomeForm } from "@/components/OutcomeForm";
import { getSituationPipeline } from "@/services/pipeline-service";
import { getOutcomeForSituation } from "@/services/outcome-service";
import { isTerminalStatus } from "@/services/supabase-server";

export const dynamic = "force-dynamic";

export default async function OutcomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pipeline = await getSituationPipeline(slug);
  if (!pipeline) notFound();

  const recPkg = pipeline.recommendationPackage;
  const outcome = await getOutcomeForSituation(slug);
  const isTerminal = outcome ? isTerminalStatus(outcome.status as string) : false;

  if (!recPkg) {
    return (
      <AppShell title={`Outcome — ${pipeline.situation.title}`}>
        <SituationNav slug={slug} />
        <section className="section">
          <p className="empty-state">No recommendation linked — outcome capture requires a recommendation.</p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Outcome — ${pipeline.situation.title}`}
      subtitle="Capture action taken, observed results, and learning"
    >
      <SituationNav slug={slug} />

      <OutcomeForm
        recommendationPackageId={recPkg.id as string}
        existing={outcome}
        isTerminal={isTerminal}
      />
    </AppShell>
  );
}
