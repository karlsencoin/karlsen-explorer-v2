import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <section className="card placeholder">
      <div className="eyebrow">404</div>
      <h1>Page not found</h1>
      <Link to="/">← Back to dashboard</Link>
    </section>
  );
}
