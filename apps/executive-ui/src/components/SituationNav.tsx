"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const WORKSPACE_TABS = [
  { segment: "", label: "Overview" },
  { segment: "provenance", label: "Glass Box" },
  { segment: "evidence", label: "Evidence" },
  { segment: "reasoning", label: "Reasoning" },
  { segment: "decision", label: "Decision" },
  { segment: "outcome", label: "Outcome" },
];

export function SituationNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/situations/${slug}`;

  return (
    <nav className="situation-nav">
      {WORKSPACE_TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const active =
          tab.segment === ""
            ? pathname === base
            : pathname.startsWith(`${base}/${tab.segment}`);
        return (
          <Link
            key={tab.segment || "overview"}
            href={href}
            className={`situation-tab ${active ? "active" : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
