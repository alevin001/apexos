"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DecisionChoice } from "@/types/executive";

const CHOICES: { value: DecisionChoice; label: string }[] = [
  { value: "accepted", label: "Accepted" },
  { value: "modified", label: "Modified" },
  { value: "rejected", label: "Rejected" },
];

export function DecisionForm({
  recommendationPackageId,
  existingDecision,
  isTerminal = false,
}: {
  recommendationPackageId: string;
  existingDecision?: {
    executive_decision_reference: string | null;
    recommendation_followed: string | null;
  } | null;
  isTerminal?: boolean;
}) {
  const router = useRouter();
  const [choice, setChoice] = useState<DecisionChoice>("accepted");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(
    existingDecision?.executive_decision_reference ?? null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationPackageId,
          choice,
          reason: reason || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to record decision");
      setResult(data.executive_decision_reference);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (isTerminal && existingDecision?.executive_decision_reference) {
    return (
      <div className="form-panel readonly">
        <h2>Decision Recorded</h2>
        <p>
          Reference: <code>{existingDecision.executive_decision_reference}</code>
        </p>
        <p>
          Response: <strong>{existingDecision.recommendation_followed}</strong>
        </p>
        <p className="form-note">
          Terminal outcome captures cannot be modified. Historical integrity preserved.
        </p>
      </div>
    );
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <h2>Record Decision</h2>
      <p className="form-note">
        Executive decision is stored as an external reference on the outcome capture, per runtime doctrine.
      </p>
      {error && <p className="form-error">{error}</p>}
      {result && (
        <p className="form-success">
          Recorded: <code>{result}</code>
        </p>
      )}
      <fieldset className="choice-group">
        <legend>Your response to the recommendation</legend>
        {CHOICES.map((c) => (
          <label key={c.value} className="choice-label">
            <input
              type="radio"
              name="choice"
              value={c.value}
              checked={choice === c.value}
              onChange={() => setChoice(c.value)}
            />
            {c.label}
          </label>
        ))}
      </fieldset>
      <label>
        Reason (optional)
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Why this decision?"
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? "Recording…" : "Record Decision"}
      </button>
    </form>
  );
}
