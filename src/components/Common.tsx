import { useState, type ReactNode } from "react";
import { ApiError } from "../api/client";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      window.setTimeout(() => setDone(false), 1200);
    } catch {
      // Clipboard blocked (insecure context or permission); nothing else to do.
    }
  };
  return (
    <button type="button" className="icon-btn small" onClick={copy} aria-label={`${label}: ${value}`} title={label}>
      {done ? (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M2 7.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <rect x="4" y="4" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M2 9.5V3a1 1 0 011-1h6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )}
    </button>
  );
}

/** Label/value rows for detail pages. */
export function KV({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <dl className="kv">
      {rows.map(([k, v], i) => (
        <div className="kv-row" key={i}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PageTitle({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="page-title">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      {children}
    </section>
  );
}

export function LoadState({ error, loading, what }: { error?: Error; loading: boolean; what: string }) {
  if (error) {
    const notFound = error instanceof ApiError && (error.status === 404 || error.status === 422);
    return (
      <div className="card notice" role="alert">
        {notFound ? `${what} not found.` : `Could not load ${what.toLowerCase()}: ${error.message}`}
      </div>
    );
  }
  if (loading) return <div className="card notice muted">Loading {what.toLowerCase()}…</div>;
  return null;
}

export function Pager(props: {
  page: number; // 0-based
  pageSize: number;
  total?: number; // unknown -> "next" enabled while the page is full
  shown: number;
  onPage: (p: number) => void;
  busy?: boolean;
}) {
  const { page, pageSize, total, shown } = props;
  const pages = total !== undefined ? Math.max(1, Math.ceil(total / pageSize)) : undefined;
  const hasNext = pages !== undefined ? page + 1 < pages : shown === pageSize;
  return (
    <nav className="pager" aria-label="Pagination">
      <button type="button" disabled={page === 0 || props.busy} onClick={() => props.onPage(0)}>
        First
      </button>
      <button type="button" disabled={page === 0 || props.busy} onClick={() => props.onPage(page - 1)}>
        ← Prev
      </button>
      <span className="muted mono">
        {page + 1}
        {pages !== undefined ? ` / ${pages.toLocaleString("en-US")}` : ""}
      </span>
      <button type="button" disabled={!hasNext || props.busy} onClick={() => props.onPage(page + 1)}>
        Next →
      </button>
      {pages !== undefined ? (
        <button type="button" disabled={!hasNext || props.busy} onClick={() => props.onPage(pages - 1)}>
          Last
        </button>
      ) : null}
    </nav>
  );
}
