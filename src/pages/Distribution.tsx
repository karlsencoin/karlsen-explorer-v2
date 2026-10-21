import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { RichEntry } from "../api/types";
import { LoadState, PageTitle, Pager } from "../components/Common";
import { AddressLink } from "../components/Links";
import { withPrefix } from "../lib/address";
import { useAddressTags } from "../lib/tags";
import { useFetch } from "../lib/useFetch";

const RICH_PAGE = 100;

/** Tier definitions. `slug` keeps the legacy /range/<slug> URLs. */
export const TIERS = [
  { id: "10M+", slug: "10m", label: "10M+ KLS", name: "Blue Whale", min: 10_000_000, max: -1 },
  { id: "1M-10M", slug: "1m", label: "1M – 10M KLS", name: "Orca", min: 1_000_000, max: 10_000_000 },
  { id: "500K-1M", slug: "500k", label: "500K – 1M KLS", name: "Great White Shark", min: 500_000, max: 1_000_000 },
  { id: "100K-500K", slug: "100k", label: "100K – 500K KLS", name: "Manta Ray", min: 100_000, max: 500_000 },
  { id: "10K-100K", slug: "10k", label: "10K – 100K KLS", name: "Sea Turtle", min: 10_000, max: 100_000 },
  { id: "1K-10K", slug: "1k", label: "1K – 10K KLS", name: "Clownfish", min: 1_000, max: 10_000 },
  { id: "100-1K", slug: "100", label: "100 – 1K KLS", name: "Seahorse", min: 100, max: 1_000 },
  { id: "1-100", slug: "1", label: "1 – 100 KLS", name: "Plankton", min: 1, max: 100 },
] as const;

const kls = (v: number, frac = 0) => v.toLocaleString("en-US", { maximumFractionDigits: frac });

function compactKls(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (a >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return Math.round(v).toString();
}

/** Change badge; null means there is no snapshot to compare with yet. */
function Delta({ value, label, compact }: { value: number | null; label: string; compact?: boolean }) {
  if (value === null || value === undefined) {
    return (
      <span className="delta none" title={`${label}: no baseline yet`}>
        — {label}
      </span>
    );
  }
  const cls = value > 0 ? "up" : value < 0 ? "down" : "";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const shown = compact ? compactKls(Math.abs(value)) : Math.abs(value).toLocaleString("en-US");
  return (
    <span className={`delta ${cls}`} title={`${label} change`}>
      {sign}
      {shown} <span className="muted">{label}</span>
    </span>
  );
}

function Trend({ e }: { e: RichEntry }) {
  if (e.is_new) return <span className="trend new" title="New in the top list since yesterday's snapshot">NEW</span>;
  const d = e.delta_24h;
  if (!d) return <span className="trend" />;
  return (
    <span className={`trend ${d > 0 ? "up" : "down"}`} title={`${d > 0 ? "+" : "−"}${compactKls(Math.abs(d))} KLS vs yesterday's snapshot`}>
      {d > 0 ? "▲" : "▼"}
    </span>
  );
}

function AddressTable({ rows, start, tags, showTrend }: { rows: RichEntry[]; start: number; tags: Record<string, string>; showTrend: boolean }) {
  return (
    <div className="table-scroll">
      <table className="data">
        <thead>
          <tr>
            <th scope="col" className="num">
              Rank
            </th>
            <th scope="col">Address</th>
            <th scope="col" className="num">
              Balance
            </th>
            <th scope="col" className="num">
              Supply
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e, i) => {
            const addr = withPrefix(e.address);
            return (
              <tr key={addr}>
                <td className="num muted">
                  {showTrend ? <Trend e={e} /> : null}
                  {(start + i + 1).toLocaleString("en-US")}
                </td>
                <td>
                  <AddressLink address={addr} tag={tags[addr]} />
                </td>
                <td className="num">
                  {kls(e.amount, 2)} <span className="muted">KLS</span>
                </td>
                <td className="num">{e.percent.toFixed(4)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Distribution() {
  const summary = useFetch("dist-summary", (s) => api.distributionSummary(s));
  const tags = useAddressTags();
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get("page") ?? "1") - 1) || 0;
  const rich = useFetch(`rich:${page}`, (s) => api.richList(RICH_PAGE, page * RICH_PAGE, s));
  const sum = summary.data;
  const byId = new Map((sum?.tiers ?? []).map((t) => [t.tier, t]));
  const maxPct = Math.max(1, ...(sum?.tiers ?? []).map((t) => t.balance_percent));

  return (
    <>
      <PageTitle eyebrow="Analytics" title="Distribution" />
      {!sum ? (
        <LoadState error={summary.error} loading={summary.loading} what="Distribution" />
      ) : (
        <>
          <section className="stat-grid">
            <article className="card stat">
              <div className="eyebrow">Addresses with balance</div>
              <div className="stat-value">{sum.total_addresses.toLocaleString("en-US")}</div>
              <div className="delta-row">
                <Delta value={sum.total_delta_1d} label="24h" />
                <Delta value={sum.total_delta_7d} label="7d" />
              </div>
            </article>
            <article className="card stat">
              <div className="eyebrow">Total balance</div>
              <div className="stat-value">
                {kls(sum.total_balance_kls)} <small>KLS</small>
              </div>
              <div className="delta-row">
                <Delta value={sum.total_delta_1d_kls} label="24h" compact />
                <Delta value={sum.total_delta_7d_kls} label="7d" compact />
              </div>
            </article>
          </section>

          <article className="card">
            <div className="card-head">
              <h2>Balance tiers</h2>
              <span className="muted small">deltas vs snapshots taken 24 h and 7 d earlier</span>
            </div>
            <div className="table-scroll">
              <table className="data tiers">
                <thead>
                  <tr>
                    <th scope="col">Tier</th>
                    <th scope="col" className="num">
                      Addresses
                    </th>
                    <th scope="col" className="num">
                      Balance
                    </th>
                    <th scope="col">Share of balance</th>
                  </tr>
                </thead>
                <tbody>
                  {TIERS.map((t) => {
                    const e = byId.get(t.id);
                    const addrPct = e && sum.total_addresses ? (e.addresses / sum.total_addresses) * 100 : 0;
                    return (
                      <tr key={t.id}>
                        <td>
                          <Link to={`/distribution/${t.slug}`}>{t.label}</Link>
                          <div className="muted small tier-name">{t.name}</div>
                        </td>
                        <td className="num">
                          {(e?.addresses ?? 0).toLocaleString("en-US")} <span className="muted">({addrPct.toFixed(2)}%)</span>
                          <div className="delta-row end">
                            <Delta value={e?.delta_1d ?? null} label="24h" />
                            <Delta value={e?.delta_7d ?? null} label="7d" />
                          </div>
                        </td>
                        <td className="num">
                          {kls(e?.balance_kls ?? 0)} <span className="muted">KLS</span>
                          <div className="delta-row end">
                            <Delta value={e?.delta_1d_kls ?? null} label="24h" compact />
                            <Delta value={e?.delta_7d_kls ?? null} label="7d" compact />
                          </div>
                        </td>
                        <td className="share">
                          <div className="share-bar" aria-hidden="true">
                            <div style={{ width: `${((e?.balance_percent ?? 0) / maxPct) * 100}%` }} />
                          </div>
                          <span className="mono">{(e?.balance_percent ?? 0).toFixed(2)}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        </>
      )}

      <article className="card">
        <div className="card-head">
          <h2>Rich list</h2>
          <span className="muted small">▲ ▼ NEW: change vs yesterday's snapshot</span>
        </div>
        {rich.data ? (
          <AddressTable rows={rich.data} start={page * RICH_PAGE} tags={tags} showTrend />
        ) : (
          <LoadState error={rich.error} loading={rich.loading} what="Rich list" />
        )}
        <Pager
          page={page}
          pageSize={RICH_PAGE}
          total={sum?.total_addresses}
          shown={rich.data?.length ?? 0}
          busy={rich.loading}
          onPage={(p) => setParams(p > 0 ? { page: String(p + 1) } : {})}
        />
      </article>
    </>
  );
}

export function DistributionTier() {
  const { tier = "" } = useParams();
  const t = TIERS.find((x) => x.slug === tier);
  const tags = useAddressTags();
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get("page") ?? "1") - 1) || 0;
  const list = useFetch(`range:${tier}`, (s) => (t ? api.range(t.min, t.max, s) : Promise.resolve([])));
  if (!t) {
    return (
      <>
        <PageTitle eyebrow="Distribution" title="Unknown tier" />
        <Link to="/distribution">← All tiers</Link>
      </>
    );
  }
  const rows = list.data ?? [];
  const slice = rows.slice(page * RICH_PAGE, (page + 1) * RICH_PAGE);
  return (
    <>
      <PageTitle eyebrow={`Distribution · ${t.name}`} title={t.label}>
        <Link to="/distribution" className="small">
          ← All tiers
        </Link>
      </PageTitle>
      <article className="card">
        {list.data ? (
          <>
            <div className="card-head">
              <span className="muted">{rows.length.toLocaleString("en-US")} addresses</span>
            </div>
            <AddressTable rows={slice} start={page * RICH_PAGE} tags={tags} showTrend={false} />
            <Pager
              page={page}
              pageSize={RICH_PAGE}
              total={rows.length}
              shown={slice.length}
              onPage={(p) => setParams(p > 0 ? { page: String(p + 1) } : {})}
            />
          </>
        ) : (
          <LoadState error={list.error} loading={list.loading} what="Addresses" />
        )}
      </article>
    </>
  );
}
