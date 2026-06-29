import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Section, ListPanel } from "@/components/Section";
import { getHomeSummary } from "@/services/home-service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let summary;
  let error: string | null = null;

  try {
    summary = await getHomeSummary();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load home summary";
    summary = {
      recentSituations: [],
      pendingFollowUps: [],
      recentRecommendations: [],
      recentOutcomes: [],
    };
  }

  return (
    <AppShell
      title="Executive Home"
      subtitle="Recent activity across the executive loop"
    >
      {error && (
        <div className="error-banner">
          Database unavailable: {error}. Ensure Supabase credentials are set in repo root .env.local
        </div>
      )}

      <div className="home-grid">
        <Section title="Recent Situations">
          <ListPanel
            items={summary.recentSituations}
            empty="No situations yet"
            renderItem={(item) => {
              const s = item as { slug: string; title: string; status: string; external_id: string };
              return (
                <li key={s.slug}>
                  <Link href={`/situations/${s.slug}`} className="list-item-title">
                    {s.title}
                  </Link>
                  <span className="list-item-meta">
                    {s.external_id} · {s.status}
                  </span>
                </li>
              );
            }}
          />
        </Section>

        <Section title="Pending Follow Ups">
          <ListPanel
            items={summary.pendingFollowUps}
            empty="No pending follow ups"
            renderItem={(item) => {
              const r = item as { id: string; title: string; external_id: string; recommendation_date: string };
              return (
                <li key={r.id}>
                  <span className="list-item-title">{r.title}</span>
                  <span className="list-item-meta">
                    {r.external_id} · {r.recommendation_date} · awaiting outcome
                  </span>
                </li>
              );
            }}
          />
        </Section>

        <Section title="Recent Recommendations">
          <ListPanel
            items={summary.recentRecommendations}
            empty="No recommendations"
            renderItem={(item) => {
              const r = item as {
                id: string;
                title: string;
                external_id: string;
                recommendation_date: string;
                confidence_summary: string | null;
              };
              return (
                <li key={r.id}>
                  <span className="list-item-title">{r.title}</span>
                  <span className="list-item-meta">
                    {r.external_id} · {r.recommendation_date}
                    {r.confidence_summary && ` · confidence: ${r.confidence_summary}`}
                  </span>
                </li>
              );
            }}
          />
        </Section>

        <Section title="Recent Outcomes">
          <ListPanel
            items={summary.recentOutcomes}
            empty="No outcomes captured"
            renderItem={(item) => {
              const o = item as {
                id: string;
                title: string;
                external_id: string;
                capture_date: string;
                status: string;
              };
              return (
                <li key={o.id}>
                  <span className="list-item-title">{o.title}</span>
                  <span className="list-item-meta">
                    {o.external_id} · {o.capture_date} · {o.status}
                  </span>
                </li>
              );
            }}
          />
        </Section>
      </div>
    </AppShell>
  );
}
