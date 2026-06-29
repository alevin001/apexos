"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OutcomeForm({
  recommendationPackageId,
  existing,
  isTerminal,
}: {
  recommendationPackageId: string;
  existing?: Record<string, unknown> | null;
  isTerminal?: boolean;
}) {
  const router = useRouter();
  const [actionTaken, setActionTaken] = useState((existing?.action_taken as string) ?? "");
  const [observedOutcome, setObservedOutcome] = useState((existing?.observed_outcome as string) ?? "");
  const [unexpected, setUnexpected] = useState(
    ((existing?.unexpected_consequences as string[]) ?? []).join("\n")
  );
  const [metricName, setMetricName] = useState("");
  const [metricValue, setMetricValue] = useState("");
  const [learningNotes, setLearningNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const measurableResults = (existing?.measurable_results as { metric: string; value: string }[]) ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendation_package_id: recommendationPackageId,
          action_taken: actionTaken,
          observed_outcome: observedOutcome,
          unexpected_consequences: unexpected.split("\n").filter(Boolean),
          measurable_results: metricName
            ? [{ metric: metricName, value: metricValue }]
            : measurableResults,
          learning_notes: learningNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to record outcome");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (isTerminal) {
    return (
      <div className="form-panel readonly">
        <h2>Outcome (Validated)</h2>
        <dl className="detail-list">
          <dt>Action Taken</dt>
          <dd>{existing?.action_taken as string}</dd>
          <dt>Observed Outcome</dt>
          <dd>{existing?.observed_outcome as string}</dd>
          <dt>Status</dt>
          <dd>{existing?.status as string}</dd>
          <dt>Decision Reference</dt>
          <dd><code>{existing?.executive_decision_reference as string}</code></dd>
        </dl>
        <p className="form-note">Validated outcomes are read-only. Historical integrity preserved.</p>
      </div>
    );
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <h2>Capture Outcome</h2>
      {error && <p className="form-error">{error}</p>}
      <label>
        Action Taken
        <textarea
          value={actionTaken}
          onChange={(e) => setActionTaken(e.target.value)}
          required
          rows={3}
        />
      </label>
      <label>
        Observed Outcome
        <textarea
          value={observedOutcome}
          onChange={(e) => setObservedOutcome(e.target.value)}
          required
          rows={3}
        />
      </label>
      <label>
        Unexpected Consequences (one per line)
        <textarea
          value={unexpected}
          onChange={(e) => setUnexpected(e.target.value)}
          rows={2}
        />
      </label>
      <div className="form-row">
        <label>
          Measured Result — Metric
          <input
            type="text"
            value={metricName}
            onChange={(e) => setMetricName(e.target.value)}
            placeholder="e.g. sessions_to_alignment"
          />
        </label>
        <label>
          Value
          <input
            type="text"
            value={metricValue}
            onChange={(e) => setMetricValue(e.target.value)}
            placeholder="e.g. 2"
          />
        </label>
      </div>
      {measurableResults.length > 0 && (
        <div className="existing-metrics">
          <p>Existing metrics:</p>
          <ul>
            {measurableResults.map((m) => (
              <li key={m.metric}>
                {m.metric}: {m.value}
              </li>
            ))}
          </ul>
        </div>
      )}
      <label>
        Learning Notes
        <textarea
          value={learningNotes}
          onChange={(e) => setLearningNotes(e.target.value)}
          rows={3}
          placeholder="What did we learn?"
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Record Outcome"}
      </button>
    </form>
  );
}
