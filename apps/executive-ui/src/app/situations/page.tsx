import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CreateSituationForm } from "@/components/CreateSituationForm";
import { listSituations } from "@/services/situation-service";

import type { Situation } from "@/types/executive";

export const dynamic = "force-dynamic";

export default async function SituationsPage() {
  let situations: Situation[];
  try {
    situations = await listSituations(50);
  } catch {
    situations = [];
  }

  return (
    <AppShell title="Situation Workspace" subtitle="Create, open, and manage executive situations">
      <div className="situations-layout">
        <div>
          <section className="section">
            <h2 className="section-title">All Situations</h2>
            {situations.length === 0 ? (
              <p className="empty-state">No situations. Create one to begin.</p>
            ) : (
              <ul className="list-panel">
                {situations.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/situations/${s.slug}`} className="list-item-title">
                      {s.title}
                    </Link>
                    <span className="list-item-meta">
                      {s.external_id} · {s.status}
                      {s.situation_type && ` · ${s.situation_type}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <CreateSituationForm />
      </div>
    </AppShell>
  );
}
