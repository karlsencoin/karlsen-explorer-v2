import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { LiveBlock, LiveTx } from "../live/feed";
import { formatAge, formatLocal, formatUtc, groupInt, sompiToKls } from "../lib/format";
import type { TagMap } from "../lib/tags";
import { useNow } from "../lib/useNow";
import { AddressLink, BlockLink, TxLink } from "./Links";

function PauseButton({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="icon-btn"
      aria-pressed={paused}
      aria-label={paused ? "Resume live updates" : "Pause live updates"}
      title={paused ? "Resume live updates" : "Pause live updates"}
      onClick={onToggle}
    >
      {paused ? (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M3 2l9 5-9 5z" fill="currentColor" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M4 2v10M10 2v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

export function LatestBlocks(props: { blocks: LiveBlock[]; paused: boolean; onTogglePause: () => void; rows?: number }) {
  const now = useNow(1000);
  const rows = props.blocks.slice(0, props.rows ?? 12);
  return (
    <article className="card">
      <div className="card-head">
        <h2>Latest blocks</h2>
        <div className="card-tools">
          <PauseButton paused={props.paused} onToggle={props.onTogglePause} />
          <Link to="/blocks">View all →</Link>
        </div>
      </div>
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th scope="col" title="Time since this explorer received the block">
                Seen
              </th>
              <th scope="col" title="Block timestamp set by the miner, in your local time">
                Timestamp
              </th>
              <th scope="col">Blue score</th>
              <th scope="col" className="num">
                Txs
              </th>
              <th scope="col">Hash</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={5}>Waiting for blocks…</td>
              </tr>
            ) : (
              rows.map((b) => (
                <tr key={b.hash} className="fresh">
                  <td className="muted">{formatAge(b.seenMs ?? b.timeMs, now)} ago</td>
                  <td className="mono" title={`${formatUtc(b.timeMs)} UTC`}>
                    {formatLocal(b.timeMs)}
                  </td>
                  <td>{groupInt(b.blueScore)}</td>
                  <td className="num">{b.txCount}</td>
                  <td>
                    <BlockLink hash={b.hash} />
                    {b.isChainBlock === false ? <span className="badge-red">off-chain</span> : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export function LatestTransactions(props: {
  txs: LiveTx[];
  tags: TagMap;
  hideCoinbase: boolean;
  onToggleCoinbase: () => void;
  paused: boolean;
  onTogglePause: () => void;
  rows?: number;
}) {
  const rows = useMemo(
    () => props.txs.filter((t) => !(props.hideCoinbase && t.coinbase)).slice(0, props.rows ?? 12),
    [props.txs, props.hideCoinbase, props.rows],
  );
  return (
    <article className="card">
      <div className="card-head">
        <h2>Latest transactions</h2>
        <div className="card-tools">
          <label className="check">
            <input type="checkbox" checked={props.hideCoinbase} onChange={props.onToggleCoinbase} /> Hide coinbase
          </label>
          <PauseButton paused={props.paused} onToggle={props.onTogglePause} />
          <Link to="/txs">View all →</Link>
        </div>
      </div>
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th scope="col">Tx id</th>
              <th scope="col" className="num">
                Amount
              </th>
              <th scope="col">Recipient</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={3}>{props.hideCoinbase ? "No non-coinbase transactions yet." : "Waiting for transactions…"}</td>
              </tr>
            ) : (
              rows.map((t) => (
                <tr key={`${t.blockHash}:${t.id}`} className="fresh">
                  <td>
                    <TxLink id={t.id} />
                  </td>
                  <td className="num">
                    {sompiToKls(t.amountSompi, 8)} <span className="muted">KLS</span>
                  </td>
                  <td>
                    <AddressLink address={t.to} tag={props.tags[t.to]} />
                    {t.outputs > 1 ? <span className="muted"> +{t.outputs - 1}</span> : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
