import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { SituationNav } from "@/components/SituationNav";
import { Section, ArtifactCard, MarkdownBody } from "@/components/Section";
import { getSituationBySlug } from "@/services/pipeline-service";
import { getEvidenceView } from "@/services/evidence-service";
import type { EvidenceItem } from "@/types/executive";

export const dynamic = "force-dynamic";

function EvidenceSection({ title, items }: { title: string; items: EvidenceItem[] }) {
  return (
    <Section title={title} empty={`No ${title.toLowerCase()}`}>
      {items.map((item) => (
        <ArtifactCard
          key={item.path}
          title={item.title ?? item.path.split("/").pop() ?? item.path}
          meta={item.note ?? item.path}
          tier={item.tier}
          body={item.body_md ?? item.summary}
        />
      ))}
    </Section>
  );
}

export default async function EvidencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const situation = await getSituationBySlug(slug);
  if (!situation) notFound();

  const evidence = await getEvidenceView(slug);

  return (
    <AppShell title={`Evidence — ${situation.title}`} subtitle="Retrieval package by architectural boundary">
      <SituationNav slug={slug} />

      {!evidence ? (
        <section className="section">
          <p className="empty-state">No evidence package linked to this situation.</p>
        </section>
      ) : (
        <>
          <EvidenceSection title="Executive Memory" items={evidence.executiveMemory} />
          <EvidenceSection title="Person Memory" items={evidence.personMemory} />
          <EvidenceSection title="Relationship Memory" items={evidence.relationshipMemory} />

          <Section title="Context">
            {evidence.context ? (
              <>
                <ArtifactCard
                  title={evidence.context.spec.title}
                  body={evidence.context.spec.situation_summary}
                />
                <div className="domain-weights">
                  {Object.entries(evidence.context.spec.domain_weights).map(([domain, weight]) => (
                    <div key={domain} className="domain-weight">
                      <strong>{weight}</strong> — {domain}
                    </div>
                  ))}
                </div>
                <MarkdownBody content={evidence.context.spec.body_md} />
              </>
            ) : (
              <p className="empty-state">No context specification</p>
            )}
          </Section>

          <EvidenceSection title="Retrieved Knowledge" items={evidence.retrievedKnowledge} />
          <EvidenceSection title="Patterns" items={evidence.patterns} />
          <EvidenceSection title="Outcome History" items={evidence.outcomeHistory} />
          <EvidenceSection title="Supporting Evidence" items={evidence.supportingEvidence} />

          <Section title="Contradictory Evidence">
            {evidence.contradictoryEvidence.length === 0 ? (
              <p className="empty-state">No contradictory evidence recorded</p>
            ) : (
              evidence.contradictoryEvidence.map((c) => (
                <ArtifactCard
                  key={c.title}
                  title={c.title}
                  meta={`Resolution: ${c.resolution_status}`}
                  body={c.body_md}
                />
              ))
            )}
          </Section>
        </>
      )}
    </AppShell>
  );
}
