export function Section({
  title,
  children,
  empty = "No items",
}: {
  title: string;
  children?: React.ReactNode;
  empty?: string;
}) {
  const hasContent = children && (Array.isArray(children) ? children.length > 0 : true);
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      <div className="section-body">
        {hasContent ? children : <p className="empty-state">{empty}</p>}
      </div>
    </section>
  );
}

export function ListPanel({
  items,
  renderItem,
  empty = "None",
}: {
  items: unknown[];
  renderItem: (item: unknown, index: number) => React.ReactNode;
  empty?: string;
}) {
  if (!items.length) return <p className="empty-state">{empty}</p>;
  return <ul className="list-panel">{items.map((item, i) => renderItem(item, i))}</ul>;
}

export function ArtifactCard({
  title,
  meta,
  body,
  tier,
}: {
  title: string;
  meta?: string;
  body?: string | null;
  tier?: string;
}) {
  return (
    <article className="artifact-card">
      <div className="artifact-card-header">
        <h3>{title}</h3>
        {tier && <span className="badge">{tier}</span>}
      </div>
      {meta && <p className="artifact-meta">{meta}</p>}
      {body && <div className="artifact-body">{body}</div>}
    </article>
  );
}

export function PipelineStageBar({
  stages,
}: {
  stages: { label: string; externalId: string; status: string; complete: boolean }[];
}) {
  return (
    <div className="pipeline-bar">
      {stages.map((stage) => (
        <div
          key={stage.label}
          className={`pipeline-stage ${stage.complete ? "complete" : "pending"}`}
        >
          <span className="stage-label">{stage.label}</span>
          <span className="stage-id">{stage.externalId}</span>
          <span className="stage-status">{stage.status}</span>
        </div>
      ))}
    </div>
  );
}

export function MarkdownBody({ content }: { content: string | null | undefined }) {
  if (!content) return null;
  return (
    <pre className="markdown-body">{content}</pre>
  );
}

export function TraceLink({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return null;
  return (
    <div className="trace-link">
      <span className="trace-label">{label}</span>
      <code>{value}</code>
    </div>
  );
}
