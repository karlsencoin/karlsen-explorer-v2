import { useRef, type ReactNode } from "react";
import { api } from "../api/client";
import {
  formatCompactUsd,
  formatDuration,
  formatHashrate,
  formatSignedPercent,
  formatUsd,
  groupInt,
  percent,
  sompiToKls,
  toBigInt,
} from "../lib/format";
import { useNow } from "../lib/useNow";
import { usePoll } from "../lib/usePoll";

function Skel() {
  return <span className="skeleton" aria-label="loading" />;
}

function Card({ title, error, children }: { title: string; error?: Error; children: ReactNode }) {
  return (
    <article className="card stat">
      <div className="eyebrow">{title}</div>
      {children}
      {error ? <div className="card-error">Update failed, showing last known values.</div> : null}
    </article>
  );
}

export function SupplyCard() {
  const { data, error } = usePoll((s) => api.coinsupply(s), 30_000);
  const circ = data ? toBigInt(data.circulatingSupply) : undefined;
  const max = data ? toBigInt(data.maxSupply) : undefined;
  const pct = circ !== undefined && max ? percent(circ, max) : undefined;
  return (
    <Card title="Coin supply" error={error}>
      <div className="stat-value">
        {circ !== undefined ? sompiToKls(circ, 0) : <Skel />} <small>KLS</small>
      </div>
      <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ? Number(pct) : 0}>
        <div style={{ width: `${pct ?? 0}%` }} />
      </div>
      <div className="stat-row">
        <span>{pct ? `${pct}% mined` : <Skel />}</span>
        <span>
          max ≈ <b>{max !== undefined ? sompiToKls(max, 0) : "—"}</b>
        </span>
      </div>
    </Card>
  );
}

export function RewardCard() {
  const reward = usePoll((s) => api.blockreward(s), 60_000);
  const halving = usePoll((s) => api.halving(s), 60_000);
  const now = useNow(1000);
  const h = halving.data;
  const left = h ? h.nextHalvingTimestamp - Math.floor(now / 1000) : undefined;
  return (
    <Card title="Block reward" error={reward.error ?? halving.error}>
      <div className="stat-value">
        {reward.data ? reward.data.blockreward.toFixed(2) : <Skel />} <small>KLS</small>
      </div>
      <div className="stat-row" style={{ flexDirection: "column", gap: 4 }}>
        <span>
          Next reduction → <span className="mono amber">{h ? `${h.nextHalvingAmount.toFixed(2)} KLS` : "—"}</span>
        </span>
        <span className="mono">
          {h ? `${h.nextHalvingDate.replace(" UTC", "")} UTC · in ${formatDuration(Math.max(0, left ?? 0))}` : <Skel />}
        </span>
      </div>
    </Card>
  );
}

export function BlockDagCard() {
  const dag = usePoll((s) => api.blockdag(s), 2_000);
  const node = usePoll((s) => api.karlsend(s), 5_000);
  const hash = usePoll((s) => api.hashrate(s), 10_000);

  // Measured blocks per second: DAA score delta over a sliding window of samples.
  const samples = useRef<{ t: number; daa: bigint }[]>([]);
  let bps: string | undefined;
  if (dag.data) {
    const daa = toBigInt(dag.data.virtualDaaScore);
    const list = samples.current;
    if (!list.length || list[list.length - 1].daa !== daa) list.push({ t: Date.now(), daa });
    while (list.length > 2 && Date.now() - list[0].t > 60_000) list.shift();
    if (list.length >= 2) {
      const first = list[0];
      const last = list[list.length - 1];
      const dt = (last.t - first.t) / 1000;
      if (dt >= 5) bps = (Number(last.daa - first.daa) / dt).toFixed(2);
    }
  }

  return (
    <Card title="BlockDAG" error={dag.error ?? node.error}>
      <div className="kv-grid">
        <div>
          <div className="k">Hashrate</div>
          <div className="v">{hash.data ? formatHashrate(hash.data.hashrate) : <Skel />}</div>
        </div>
        <div>
          <div className="k">Blocks / sec</div>
          <div className="v">{bps ?? <Skel />}</div>
        </div>
        <div>
          <div className="k">Virtual DAA score</div>
          <div className="v">{dag.data ? groupInt(dag.data.virtualDaaScore) : <Skel />}</div>
        </div>
        <div>
          <div className="k">Mempool</div>
          <div className="v">{node.data ? `${groupInt(node.data.mempoolSize)} tx` : <Skel />}</div>
        </div>
      </div>
      <div className="stat-row">
        <span>{dag.data?.networkName ?? ""}</span>
        <span>{node.data ? (node.data.isSynced ? "node synced" : "node syncing") : ""}</span>
      </div>
    </Card>
  );
}

export function MarketCard() {
  const { data, error } = usePoll((s) => api.marketData(s), 60_000);
  const ch = data?.price_change_percentage_24h;
  return (
    <Card title="Market" error={error}>
      <div className="stat-value">{data ? formatUsd(data.current_price.usd, 8) : <Skel />}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span className={`pill ${ch === undefined ? "" : ch >= 0 ? "up" : "down"}`}>
          24h {ch === undefined ? "—" : formatSignedPercent(ch)}
        </span>
        <span className="pill">H {data ? formatUsd(data.high_24h.usd, 8) : "—"}</span>
        <span className="pill">L {data ? formatUsd(data.low_24h.usd, 8) : "—"}</span>
      </div>
      <div className="stat-row">
        <span>
          Volume 24h <b>{data ? formatCompactUsd(data.total_volume.usd) : "—"}</b>
        </span>
        <span>
          Market cap <b>{data ? formatCompactUsd(data.market_cap.usd) : "—"}</b>
        </span>
      </div>
    </Card>
  );
}
