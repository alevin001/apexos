import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ConversationInterface } from "@/components/ConversationInterface";
import { Section, ListPanel } from "@/components/Section";
import { getHomeSummary } from "@/services/home-service";
import { listRecentConversations } from "@/services/conversation-service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let summary;
  let recentConversations: Awaited<ReturnType<typeof listRecentConversations>> = [];
  let error: string | null = null;

  try {
    [summary, recentConversations] = await Promise.all([
      getHomeSummary(),
      listRecentConversations(5),
    ]);
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
      title="ApexOS"
      subtitle="Describe situations naturally — the executive reasoning pipeline handles the rest"
    >
      {error && (
        <div className="error-banner">
          Database unavailable: {error}. Ensure Supabase credentials are set in repo root .env.local
        </div>
      )}

      <div className="home-conversation-layout">
        <section className="conversation-primary">
          <ConversationInterface />
        </section>

        <aside className="home-sidebar">
          {recentConversations.length > 0 && (
            <Section title="Recent Conversations">
              <ListPanel
                items={recentConversations}
                empty="No conversations yet"
                renderItem={(item) => {
                  const c = item as { id: string; external_id: string; status: string; situation_slug?: string | null };
                  return (
                    <li key={c.id}>
                      <span className="list-item-title">{c.external_id}</span>
                      <span className="list-item-meta">
                        {c.status}
                        {c.situation_slug && (
                          <>
                            {" · "}
                            <Link href={`/situations/${c.situation_slug}`}>situation</Link>
                          </>
                        )}
                      </span>
                    </li>
                  );
                }}
              />
            </Section>
          )}

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
        </aside>
      </div>
    </AppShell>
  );
}
