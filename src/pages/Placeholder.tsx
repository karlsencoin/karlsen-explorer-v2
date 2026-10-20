import { Link, useParams } from "react-router-dom";

/** Temporary page for routes that are not built yet; keeps old URLs resolvable. */
export function Placeholder({ title }: { title: string }) {
  const params = useParams();
  const id = params.id ?? params.addr;
  return (
    <section className="card placeholder">
      <div className="eyebrow">In progress</div>
      <h1>{title}</h1>
      {id ? <p className="mono muted" style={{ overflowWrap: "anywhere" }}>{id}</p> : null}
      <p className="muted">This page is being rebuilt for the new explorer.</p>
      <Link to="/">← Back to dashboard</Link>
    </section>
  );
}

export function NotFound() {
  return (
    <section className="card placeholder">
      <div className="eyebrow">404</div>
      <h1>Page not found</h1>
      <Link to="/">← Back to dashboard</Link>
    </section>
  );
}
