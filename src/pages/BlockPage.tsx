import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Block, Transaction } from "../api/types";
import { CopyButton, KV, LoadState, PageTitle } from "../components/Common";
import { AddressLink, BlockLink, TxLink } from "../components/Links";
import { formatAge, formatUtc, groupInt, sompiToKls, toBigInt } from "../lib/format";
import { useAddressTags } from "../lib/tags";
import { useFetch } from "../lib/useFetch";

function HashList({ hashes, empty = "—" }: { hashes: string[]; empty?: string }) {
  if (!hashes.length) return <span className="muted">{empty}</span>;
  return (
    <ul className="hash-list">
      {hashes.map((h) => (
        <li key={h}>
          <BlockLink hash={h} short={false} />
        </li>
      ))}
    </ul>
  );
}

function BlockTxs({ txs }: { txs: Transaction[] }) {
  const tags = useAddressTags();
  return (
    <article className="card">
      <div className="card-head">
        <h2>Transactions ({txs.length})</h2>
      </div>
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th scope="col">Tx id</th>
              <th scope="col">Outputs</th>
              <th scope="col" className="num">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {txs.map((t) => {
              const coinbase = t.inputs.length === 0;
              return t.outputs.map((o, i) => (
                <tr key={`${t.verboseData.transactionId}:${i}`}>
                  <td>
                    {i === 0 ? (
                      <>
                        <TxLink id={t.verboseData.transactionId} />
                        {coinbase ? <span className="tag neutral">coinbase</span> : null}
                      </>
                    ) : null}
                  </td>
                  <td>
                    <AddressLink
                      address={o.verboseData.scriptPublicKeyAddress}
                      tag={tags[o.verboseData.scriptPublicKeyAddress]}
                    />
                  </td>
                  <td className="num">
                    {sompiToKls(toBigInt(o.amount))} <span className="muted">KLS</span>
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function BlockView({ b }: { b: Block }) {
  const h = b.header;
  const v = b.verboseData;
  const ts = Number(h.timestamp);
  const parents = h.parents[0]?.parentHashes ?? [];
  return (
    <>
      <section className="card detail">
        <KV
          rows={[
            [
              "Hash",
              <span className="mono break">
                {v.hash} <CopyButton value={v.hash} />
              </span>,
            ],
            ["Time", <span className="mono">{formatUtc(ts)} UTC · {formatAge(ts)} ago</span>],
            ["Blue score", <span className="mono">{groupInt(h.blueScore)}</span>],
            ["DAA score", <span className="mono">{groupInt(h.daaScore)}</span>],
            [
              "Chain block",
              v.isChainBlock ? <span className="ok">yes</span> : <span className="amber">no (merged by another block)</span>,
            ],
            ["Color", b.extra.color ? <span className={b.extra.color === "blue" ? "ok" : "amber"}>{b.extra.color}</span> : <span className="muted">—</span>],
            [
              "Miner",
              b.extra.minerAddress ? (
                <>
                  <AddressLink address={b.extra.minerAddress} short={false} />
                  {b.extra.minerInfo ? <div className="muted small mono">{b.extra.minerInfo}</div> : null}
                </>
              ) : (
                <span className="muted">—</span>
              ),
            ],
            ["Difficulty", <span className="mono">{v.difficulty.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>],
            ["Blue work", <span className="mono break">{h.blueWork}</span>],
            ["Bits / nonce", <span className="mono">{h.bits} / {h.nonce}</span>],
            ["Version", <span className="mono">{h.version}</span>],
            ["Selected parent", v.selectedParentHash ? <BlockLink hash={v.selectedParentHash} short={false} /> : <span className="muted">—</span>],
            ["Parents", <HashList hashes={parents} />],
            ["Children", <HashList hashes={v.childrenHashes} empty="none yet" />],
            ["Merge set (blue)", <HashList hashes={v.mergeSetBluesHashes} />],
            ["Merge set (red)", <HashList hashes={v.mergeSetRedsHashes} />],
            ["Merkle root", <span className="mono break">{h.hashMerkleRoot}</span>],
            ["Accepted id merkle root", <span className="mono break">{h.acceptedIdMerkleRoot}</span>],
            ["UTXO commitment", <span className="mono break">{h.utxoCommitment}</span>],
            ["Pruning point", <BlockLink hash={h.pruningPoint} short={false} />],
          ]}
        />
      </section>
      {b.transactions ? <BlockTxs txs={b.transactions} /> : null}
    </>
  );
}

export function BlockPage() {
  const { id = "" } = useParams();
  const { data, error, loading } = useFetch(`block:${id}`, (s) => api.block(id, true, s));
  return (
    <>
      <PageTitle eyebrow="Block" title={<span className="mono break title-hash">{id}</span>}>
        <Link to="/blocks" className="small">
          ← Latest blocks
        </Link>
      </PageTitle>
      {data && data.verboseData.hash === id ? <BlockView b={data} /> : <LoadState error={error} loading={loading} what="Block" />}
    </>
  );
}
