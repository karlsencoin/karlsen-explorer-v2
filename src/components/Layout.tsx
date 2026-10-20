import { Link, NavLink, Outlet } from "react-router-dom";
import { api } from "../api/client";
import { formatSignedPercent, formatUsd } from "../lib/format";
import { usePoll } from "../lib/usePoll";

const NAV = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/blocks", label: "Blocks" },
  { to: "/txs", label: "Transactions" },
  { to: "/distribution", label: "Distribution" },
  { to: "/bridge", label: "Bridge" },
];

function HeaderPrice() {
  const { data } = usePoll((s) => api.marketData(s), 60_000);
  if (!data) return <span className="header-price mono">KLS <span className="skeleton" /></span>;
  const ch = data.price_change_percentage_24h;
  return (
    <span className="header-price mono">
      KLS <span style={{ color: "var(--text)" }}>{formatUsd(data.current_price.usd, 8)}</span>{" "}
      <span style={{ color: ch >= 0 ? "var(--green-text)" : "var(--red-text)" }}>{formatSignedPercent(ch)}</span>
    </span>
  );
}

export function Layout() {
  return (
    <>
      <header className="site-header">
        <div className="container">
          <Link to="/" className="brand" aria-label="Karlsen Explorer home">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
              <circle cx="14" cy="14" r="13" fill="none" stroke="#06D6D0" strokeWidth="2" />
              <path d="M10 7v14M10 14l7-7M10 14l7 7" fill="none" stroke="#06D6D0" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Karlsen <span>Explorer</span>
          </Link>
          <nav className="nav" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <HeaderPrice />
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container">
          <span>Karlsen Explorer · open source</span>
          <nav aria-label="Footer">
            <a href="https://karlsencoin.org">karlsencoin.org</a>
            <a href="https://api.karlsencoin.org/">API</a>
            <a href="https://github.com/karlsencoin/karlsen-explorer-v2">GitHub</a>
            <a href="https://discord.gg/QyrvshRBJV">Discord</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
