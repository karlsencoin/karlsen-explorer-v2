import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { TxJson } from "../api/types";
import { CopyButton, LoadState, PageTitle, Pager } from "../components/Common";
import { AddressLink, TxLink } from "../components/Links";
import { sameAddress, withPrefix } from "../lib/address";
import { formatAge, formatUsd, formatUtc, groupInt, sompiToKls, toBigInt } from "../lib/format";
import { useAddressTags } from "../lib/tags";
import { useFetch } from "../lib/useFetch";
import { usePoll } from "../lib/usePoll";

const TX_PAGE = 25;
const UTXO_PAGE = 50;

/** Net effect of a transaction on `addr`, in sompi (outputs to it minus inputs from it). */
export function netChange(t: TxJson, addr: string): bigint {
  let net = 0n;
  for (const o of t.outputs ?? []) {
    if (o.script_public_key_address && sameAddress(o.script_public_key_address, addr)) net += toBigInt(o.amount);
  }
  for (const i of t.inputs ?? []) {
    if (i.previous_outpoint_address && sameAddress(i.previous_outpoint_address, addr)) {
      net -= toBigInt(i.previous_outpoint_amount ?? 0);
    }
  }
  return net;
}

function Summary({ addr }: { addr: string }) {
  const bal = useFetch(`bal:${addr}`, (s) => api.addressBalance(addr, s));
  const count = useFetch(`cnt:${addr}`, (s) => api.addressTxCount(addr, s));
  const market = usePoll((s) => api.marketData(s), 60_000);
  const sompi = bal.data ? toBigInt(bal.data.balance) : undefined;
  const usd =
    sompi !== undefined && market.data ? (Number(sompi / 100_000_000n) + Number(sompi % 100_000_000n) / 1e8) * market.data.current_price.usd : undefined;
  return (
    <section className="stat-grid">
      <article className="card stat">
        <div className="eyebrow">Balance</div>
        <div className="stat-value">
          {sompi !== undefined ? sompiToKls(sompi) : bal.error ? "—" : <span className="skeleton" />} <small>KLS</small>
        </div>
        <div className="stat-row">
          <span>{usd !== undefined ? `≈ ${formatUsd(usd)}` : ""}</span>
        </div>
        {bal.error ? <div className="card-error">Balance unavailable: {bal.error.message}</div> : null}
      </article>
      <article className="card stat">
        <div className="eyebrow">Transactions</div>
        <div className="stat-value">{count.data ? groupInt(count.data.total) : count.error ? "—" : <span className="skeleton" />}</div>
        <div className="stat-row">
          <span>all time, including coinbase rewards</span>
        </div>
      </article>
    </section>
  );
}

function TxHistory({ addr, page, onPage }: { addr: string; page: number; onPage: (p: number) => void }) {
  const count = useFetch(`cnt:${addr}`, (s) => api.addressTxCount(addr, s));
  const { data, error, loading } = useFetch(`txs:${addr}:${page}`, (s) => api.addressTxs(addr, TX_PAGE, page * TX_PAGE, s));
  return (
    <article className="card">
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Tx id</th>
              <th scope="col" className="num">
                Change
              </th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {!data ? (
              <tr className="empty-row">
                <td colSpan={4}>{error ? `Could not load transactions: ${error.message}` : "Loading…"}</td>
              </tr>
            ) : data.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={4}>No transactions.</td>
              </tr>
            ) : (
              data.map((t) => {
                const net = netChange(t, addr);
                return (
                  <tr key={t.transaction_id} style={{ opacity: loading ? 0.6 : 1 }}>
                    <td className="muted" title={t.block_time ? formatUtc(t.block_time) + " UTC" : ""}>
                      {t.block_time ? formatAge(t.block_time) + " ago" : "—"}
                    </td>
                    <td>
                      <TxLink id={t.transaction_id} />
                    </td>
                    <td className={`num ${net > 0n ? "pos" : net < 0n ? "neg" : ""}`}>
                      {net > 0n ? "+" : ""}
                      {sompiToKls(net)} <span className="muted">KLS</span>
                    </td>
                    <td>{t.is_accepted ? <span className="ok">accepted</span> : <span className="amber">pending</span>}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pager page={page} pageSize={TX_PAGE} total={count.data?.total} shown={data?.length ?? 0} onPage={onPage} busy={loading} />
    </article>
  );
}

function Utxos({ addr, page, onPage }: { addr: string; page: number; onPage: (p: number) => void }) {
  const { data, error, loading } = useFetch(`utxo:${addr}:${page}`, (s) => api.addressUtxos(addr, UTXO_PAGE, page * UTXO_PAGE, s));
  return (
    <article className="card">
      {data ? (
        <div className="card-head">
          <span className="muted">
            {groupInt(data.total)} UTXOs · {sompiToKls(data.totalAmount)} KLS · newest first
          </span>
        </div>
      ) : null}
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th scope="col">Outpoint</th>
              <th scope="col" className="num">
                Amount
              </th>
              <th scope="col">DAA score</th>
              <th scope="col">Type</th>
            </tr>
          </thead>
          <tbody>
            {!data ? (
              <tr className="empty-row">
                <td colSpan={4}>{error ? `Could not load UTXOs: ${error.message}` : "Loading…"}</td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={4}>No unspent outputs.</td>
              </tr>
            ) : (
              data.items.map((u) => (
                <tr key={`${u.outpoint.transactionId}:${u.outpoint.index}`} style={{ opacity: loading ? 0.6 : 1 }}>
                  <td>
                    <TxLink id={u.outpoint.transactionId} /> <span className="muted">#{u.outpoint.index}</span>
                  </td>
                  <td className="num">
                    {sompiToKls(toBigInt(u.utxoEntry.amount))} <span className="muted">KLS</span>
                  </td>
                  <td>{groupInt(u.utxoEntry.blockDaaScore)}</td>
                  <td>{u.utxoEntry.isCoinbase ? <span className="tag neutral">coinbase</span> : <span className="muted">transfer</span>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pager page={page} pageSize={UTXO_PAGE} total={data?.total} shown={data?.items.length ?? 0} onPage={onPage} busy={loading} />
    </article>
  );
}

const WALLET_PAGE = 25;

/**
 * The wallet's change chain (addresses whose balance moved on to a fresh
 * change address) and the merged history of all of them.
 */
function WalletHistoryView({ addr, page, onPage, tags }: { addr: string; page: number; onPage: (p: number) => void; tags: Record<string, string> }) {
  const chain = useFetch(`chain:${addr}`, (s) => api.walletChain(addr, s));
  const hist = useFetch(`whist:${addr}:${page}`, (s) => api.walletHistory(addr, WALLET_PAGE, page * WALLET_PAGE, s));
  const links = chain.data?.addresses ?? [];
  return (
    <>
      <article className="card">
        <div className="card-head">
          <h2>Wallet change chain</h2>
          <span className="muted small">likely the same wallet: each address received the previous one's change</span>
        </div>
        {!chain.data ? (
          <p className="card-body muted">{chain.error ? `Could not load the change chain: ${chain.error.message}` : "Following the change chain…"}</p>
        ) : links.length === 1 ? (
          <p className="card-body muted">
            No change chain found for this address: its balance did not arrive as change from another address, and it has not moved on to a fresh change address.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Step</th>
                  <th scope="col">Address</th>
                  <th scope="col">Received as change in</th>
                  <th scope="col">Time</th>
                </tr>
              </thead>
              <tbody>
                {chain.data.earlier_truncated ? (
                  <tr className="empty-row">
                    <td colSpan={4}>Older addresses exist; the walk stopped after 100 steps.</td>
                  </tr>
                ) : null}
                {links.map((l) => (
                  <tr key={l.address} className={l.position === 0 ? "current" : undefined}>
                    <td className="muted">{l.position === 0 ? "this address" : l.position < 0 ? `${l.position}` : `+${l.position}`}</td>
                    <td>
                      <AddressLink address={l.address} tag={tags[l.address]} />
                    </td>
                    <td>{l.via_transaction_id ? <TxLink id={l.via_transaction_id} short /> : <span className="muted">start of the chain</span>}</td>
                    <td className="muted" title={l.via_block_time ? formatUtc(l.via_block_time) + " UTC" : ""}>
                      {l.via_block_time ? formatAge(l.via_block_time) + " ago" : "—"}
                    </td>
                  </tr>
                ))}
                {chain.data.later_truncated ? (
                  <tr className="empty-row">
                    <td colSpan={4}>Newer addresses exist; the walk stopped after 100 steps.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </article>
      <article className="card">
        <div className="card-head">
          <h2>All transactions of the wallet</h2>
          <span className="muted small">
            {hist.data ? `${groupInt(hist.data.total)} transactions across ${hist.data.chain_length} address${hist.data.chain_length === 1 ? "" : "es"} · moves between its own addresses count only what left the wallet` : ""}
          </span>
        </div>
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Tx id</th>
                <th scope="col">Wallet address</th>
                <th scope="col">From / To</th>
                <th scope="col" className="num">
                  Change
                </th>
              </tr>
            </thead>
            <tbody>
              {!hist.data ? (
                <tr className="empty-row">
                  <td colSpan={5}>{hist.error ? `Could not load the wallet history: ${hist.error.message}` : "Loading…"}</td>
                </tr>
              ) : hist.data.transactions.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={5}>No transactions.</td>
                </tr>
              ) : (
                hist.data.transactions.map((t) => {
                  const net = BigInt(t.net_sompi);
                  return (
                    <tr key={t.transaction_id} style={{ opacity: hist.loading ? 0.6 : 1 }}>
                      <td className="muted" title={t.block_time ? formatUtc(t.block_time) + " UTC" : ""}>
                        {t.block_time ? formatAge(t.block_time) + " ago" : "—"}
                      </td>
                      <td>
                        <TxLink id={t.transaction_id} short />
                      </td>
                      <td>
                        {/* The address the money went to comes first at full strength;
                            the other wallet addresses it touched are dimmed. */}
                        {[...t.addresses]
                          .sort((a, b) => Number(sameAddress(b, t.main_address ?? "")) - Number(sameAddress(a, t.main_address ?? "")))
                          .map((a) => {
                            const secondary = !!t.main_address && !sameAddress(a, t.main_address);
                            return (
                              <div
                                key={a}
                                className={secondary ? "wallet-addr-secondary" : undefined}
                                title={secondary ? "Also part of this wallet in this transaction (spent from or co-input)" : undefined}
                              >
                                <AddressLink address={a} short tag={sameAddress(a, addr) ? "this address" : undefined} />
                              </div>
                            );
                          })}
                      </td>
                      <td>
                        {t.counterparty_address ? (
                          <div title={net > 0n ? "Sent by (largest outside sender)" : "Sent to (largest outside recipient)"}>
                            <span className="muted">{net > 0n ? "from " : "to "}</span>
                            <AddressLink address={t.counterparty_address} short />
                            {(t.counterparty_count ?? 0) > 1 && <span className="muted"> +{(t.counterparty_count ?? 0) - 1}</span>}
                          </div>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className={`num ${net > 0n ? "pos" : net < 0n ? "neg" : ""}`}>
                        {net > 0n ? "+" : ""}
                        {sompiToKls(net)} <span className="muted">KLS</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pager page={page} pageSize={WALLET_PAGE} total={hist.data?.total} shown={hist.data?.transactions.length ?? 0} onPage={onPage} busy={hist.loading} />
      </article>
    </>
  );
}

export function AddressPage() {
  const { addr: raw = "" } = useParams();
  const addr = withPrefix(raw);
  const tags = useAddressTags();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const tab = tabParam === "utxos" || tabParam === "wallet" ? tabParam : "txs";
  const page = Math.max(0, Number(params.get("page") ?? "1") - 1) || 0;
  const go = (t: string, p: number) => {
    const next = new URLSearchParams();
    if (t !== "txs") next.set("tab", t);
    if (p > 0) next.set("page", String(p + 1));
    setParams(next);
  };
  const valid = useFetch(`bal:${addr}`, (s) => api.addressBalance(addr, s));
  return (
    <>
      <PageTitle
        eyebrow={tags[addr] ? `Address · ${tags[addr]}` : "Address"}
        title={
          <span className="mono break title-hash">
            {addr} <CopyButton value={addr} label="Copy address" />
          </span>
        }
      />
      {valid.error ? (
        <LoadState error={valid.error} loading={false} what="Address" />
      ) : (
        <>
          <Summary addr={addr} />
          <div className="tabs" role="tablist" aria-label="Address views">
            <button type="button" role="tab" aria-selected={tab === "txs"} onClick={() => go("txs", 0)}>
              Transactions
            </button>
            <button type="button" role="tab" aria-selected={tab === "utxos"} onClick={() => go("utxos", 0)}>
              UTXOs
            </button>
            <button type="button" role="tab" aria-selected={tab === "wallet"} onClick={() => go("wallet", 0)}>
              Wallet history
            </button>
          </div>
          {tab === "txs" ? (
            <TxHistory addr={addr} page={page} onPage={(p) => go("txs", p)} />
          ) : tab === "utxos" ? (
            <Utxos addr={addr} page={page} onPage={(p) => go("utxos", p)} />
          ) : (
            <WalletHistoryView addr={addr} page={page} onPage={(p) => go("wallet", p)} tags={tags} />
          )}
        </>
      )}
    </>
  );
}
