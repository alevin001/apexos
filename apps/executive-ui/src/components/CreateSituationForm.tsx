"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateSituationForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/situations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, situation_summary: summary }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create situation");
      router.push(`/situations/${data.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <h2>Create Situation</h2>
      {error && <p className="form-error">{error}</p>}
      <label>
        Title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Brief situation title"
        />
      </label>
      <label>
        Summary
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          rows={4}
          placeholder="What requires executive attention?"
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? "Creating…" : "Create Situation"}
      </button>
    </form>
  );
}
