import type { ReactNode } from "react";
import { API_BASE, api } from "../api/client";
import { KV, LoadState, PageTitle } from "../components/Common";
import { AddressLink } from "../components/Links";
import { formatUtc } from "../lib/format";
import { usePoll } from "../lib/usePoll";

// Squads 2-of-3 vault: holds the bridge program upgrade authority and BridgeConfig authority.
const SQUADS_VAULT = "CcJfUrkgGyokHuRmyBnPhg3Gf27N2etenyW61nf6Yc1j";
// Raydium CPMM wKLS/USDC pool.
const RAYDIUM_POOL = "FVRhv8zyfQxQGERSajqNjVUzFMqt9E7eMypPemp5hg78";

const STATUS: Record<string, { label: string; cls: string }> = {
  OK: { label: "Fully backed", cls: "ok" },
  UNDERCOLLATERALIZED: { label: "Under-collateralized", cls: "neg" },
  DEGRADED: { label: "Cannot verify right now", cls: "amber" },
};

/** "1234567.00000000" -> "1,234,567.00000000" with string math (no float rounding). */
function fmt(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return "—";
  const [w, f] = String(s).split(".");
  return w.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (f ? `.${f}` : "");
}

function ruleText(r?: string): string {
  return r
    ? r.replace(/_kls/g, " KLS").replace("wkls_supply", "wKLS supply").replace(/_/g, " ").replace(">=", "≥")
    : "vault KLS ≥ wKLS supply";
}

function Sol({ addr, note }: { addr?: string; note?: ReactNode }) {
  if (!addr) return <span className="muted">—</span>;
  return (
    <>
      <a href={`https://solscan.io/account/${addr}`} target="_blank" rel="noreferrer" className="mono break">
        {addr}
      </a>
      {note ? <div className="muted small">{note}</div> : null}
    </>
  );
}

export function Bridge() {
  const { data, error, loading } = usePoll((s) => api.bridgeReserves(s), 30_000);
  const k = data?.karlsen;
  const s = data?.solana;
  const hot = k?.hot_wallet ?? null;
  const pk = k?.vault.pubkeys_script_order ?? [];
  const total = k ? k.total_reserve_kls ?? k.vault.balance_kls : undefined;
  const issues = [...(data?.errors ?? []), ...(data?.warnings ?? [])];
  const st = data ? STATUS[data.status] ?? { label: data.status, cls: "amber" } : undefined;

  return (
    <>
      <PageTitle eyebrow="Proof of reserves" title="wKLS Bridge">
        <p className="muted lead">
          Every wKLS on Solana must be backed 1:1 by KLS held by the bridge: the Karlsen 2-of-3 multisig vault
          {hot ? " plus the bridge hot wallet" : ""}. Rule: <span className="mono">{ruleText(data?.rule)}</span>. Custodial
          bridge, operated by Karlsen.
        </p>
      </PageTitle>

      {!data ? (
        <LoadState error={error} loading={loading} what="Reserves" />
      ) : (
        <>
          <section className="stat-grid">
            <article className="card stat">
              <div className="eyebrow">Status</div>
              <div className={`stat-value ${st?.cls ?? ""}`}>{st?.label}</div>
              <div className="stat-row">
                <span>{data.generated_at ? `updated ${formatUtc(data.generated_at * 1000)} UTC` : ""}</span>
                <span>refreshes every 30 s</span>
              </div>
              {data.rechecked ? (
                <div className="card-error">
                  Reserves looked short on the first read (a hot wallet → vault sweep may have been in flight) and were
                  re-read before this status was reported.
                </div>
              ) : null}
            </article>
            <article className="card stat">
              <div className="eyebrow">Total KLS reserve</div>
              <div className="stat-value">
                {fmt(total)} <small>KLS</small>
              </div>
              <div className="stat-row">
                <span>
                  wKLS supply <b>{s ? fmt(s.total_supply_wkls) : "—"}</b>
                </span>
                <span>
                  surplus <b>{data.surplus ? fmt(data.surplus.kls) : "—"}</b>
                </span>
              </div>
            </article>
          </section>

          {issues.length ? (
            <div className="card notice amber" role="status">
              <ul className="plain">
                {issues.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {error ? <div className="card notice amber">Last refresh failed; showing the previous reading.</div> : null}

          {k ? (
            <article className="card">
              <div className="card-head">
                <h2>Karlsen vault</h2>
              </div>
              <div className="detail">
                <KV
                  rows={[
                    ["Vault address", <AddressLink address={k.vault.address} short={false} />],
                    ["Type", k.vault.type],
                    ["Balance", <span className="mono">{fmt(k.vault.balance_kls)} KLS</span>],
                    ["Pubkey A", <span className="mono break">{pk[0] ?? "—"}</span>],
                    ["Pubkey B", <span className="mono break">{pk[1] ?? "—"}</span>],
                    ["Pubkey C", <span className="mono break">{pk[2] ?? "—"}</span>],
                    ["UTXO count", <span className="mono">{k.vault.utxo_count}</span>],
                    ["Circulating supply", <span className="mono">{fmt(k.circulating_supply_kls)} KLS</span>],
                    [
                      "Reserve share of circulating",
                      <span className="mono">{k.reserve_share_of_circulating_percent ?? k.vault_share_of_circulating_percent ?? "—"} %</span>,
                    ],
                  ]}
                />
              </div>
            </article>
          ) : null}

          {hot ? (
            <article className="card">
              <div className="card-head">
                <h2>Bridge hot wallet</h2>
              </div>
              <div className="detail">
                <KV
                  rows={[
                    ["Address", <AddressLink address={hot.address} short={false} />],
                    ["Type", hot.type],
                    ["Purpose", hot.purpose ?? "—"],
                    ["Balance", <span className="mono">{fmt(hot.balance_kls)} KLS</span>],
                    ["UTXO count", <span className="mono">{hot.utxo_count}</span>],
                    ["Sweep threshold", hot.sweep_threshold_kls ? <span className="mono">{fmt(hot.sweep_threshold_kls)} KLS</span> : "—"],
                  ]}
                />
              </div>
            </article>
          ) : null}

          {s ? (
            <article className="card">
              <div className="card-head">
                <h2>Solana wKLS mint</h2>
              </div>
              <div className="detail">
                {s.launched ? (
                  <KV
                    rows={[
                      ["Cluster", s.cluster ?? "—"],
                      ["Mint", <Sol addr={s.wkls_mint} />],
                      ["Mint authority", <Sol addr={s.mint_authority} note="bridge program PDA: no person can mint" />],
                      ["Freeze authority", s.freeze_authority ?? "none: no wallet can ever be frozen"],
                      ["Bridge program", <Sol addr={s.bridge_program_id} />],
                      ["Program upgrade authority", <Sol addr={SQUADS_VAULT} note="Squads 2-of-3 multisig" />],
                      [
                        "Raydium pool (wKLS/USDC)",
                        <a href={`https://dexscreener.com/solana/${RAYDIUM_POOL}`} target="_blank" rel="noreferrer" className="mono break">
                          {RAYDIUM_POOL}
                        </a>,
                      ],
                      ["Collateral ratio", <span className="mono">{data.collateral_ratio ?? "—"}</span>],
                      ["Finalized slot", <span className="mono">{s.finalized_slot ?? "—"}</span>],
                    ]}
                  />
                ) : (
                  <KV
                    rows={[
                      ["Status", "Not launched yet: no wKLS exists"],
                      ["Bridge program", <span className="mono break">{s.bridge_program_id ?? "—"}</span>],
                    ]}
                  />
                )}
              </div>
            </article>
          ) : null}
        </>
      )}

      <article className="card prose">
        <h2>Why do DEX sites say "this token is mintable"?</h2>
        <p>
          wKLS is a bridged token, so new wKLS must be created whenever someone bridges KLS in. That right belongs only to
          the bridge program, not to any person or wallet. The program mints only after a KLS deposit to the bridge is
          confirmed on the Karlsen network, and burns wKLS when KLS is paid back out. Every mint is therefore matched by
          locked KLS, which you can check above. Freeze authority is disabled, and the program can only be changed by a
          2-of-3 Squads multisig.
        </p>
        <h2>Verify it yourself</h2>
        <ol>
          <li>
            Open the vault address{hot ? " and the hot wallet address" : ""} above and compare the balances
            {hot ? "; together they are the total reserve" : ""}.
          </li>
          <li>Open the wKLS mint on the Solana explorer and read the total supply and mint authority.</li>
          <li>Rebuild the vault address from the three pubkeys (2-of-3 Schnorr P2SH, script order A, B, C).</li>
          <li>
            Raw data:{" "}
            <a href={`${API_BASE}/bridge/reserves`} target="_blank" rel="noreferrer">
              {API_BASE.replace(/^https?:\/\//, "")}/bridge/reserves
            </a>{" "}
            (JSON, refreshed every 30 s).
          </li>
        </ol>
      </article>
    </>
  );
}
