import { useParams } from "react-router-dom";
import { api } from "../api/client";
import type { TxJson } from "../api/types";
import { CopyButton, KV, LoadState, PageTitle } from "../components/Common";
import { AddressLink, BlockLink, TxLink } from "../components/Links";
import { withPrefix } from "../lib/address";
import { formatAge, formatUtc, groupInt, sompiToKls, toBigInt } from "../lib/format";
import { useAddressTags } from "../lib/tags";
import { useFetch } from "../lib/useFetch";

const COINBASE_SUBNETWORK = "0100000000000000000000000000000000000000";

export function txTotals(t: TxJson) {
  const out = (t.outputs ?? []).reduce((a, o) => a + toBigInt(o.amount), 0n);
  const inputs = t.inputs ?? [];
  const resolved = inputs.every((i) => i.previous_outpoint_amount !== null);
  const inp = inputs.reduce((a, i) => a + toBigInt(i.previous_outpoint_amount ?? 0), 0n);
  const coinbase = t.subnetwork_id === COINBASE_SUBNETWORK || inputs.length === 0;
  const fee = !coinbase && resolved && inputs.length ? inp - out : undefined;
  return { out, inp, fee, coinbase, resolved };
}

function TxView({ t }: { t: TxJson }) {
  const tags = useAddressTags();
  const { out, fee, coinbase } = txTotals(t);
  const time = t.block_time ?? undefined;
  return (
    <>
      <section className="card detail">
        <KV
          rows={[
            [
              "Transaction id",
              <span className="mono break">
                {t.transaction_id} <CopyButton value={t.transaction_id} />
              </span>,
            ],
            ["Hash", <span className="mono break">{t.hash ?? "—"}</span>],
            ["Status", t.is_accepted ? <span className="ok">accepted</span> : <span className="amber">not accepted yet</span>],
            ["Time", time ? <span className="mono">{formatUtc(time)} UTC · {formatAge(time)} ago</span> : "—"],
            ["Total output", <span className="mono">{sompiToKls(out)} KLS</span>],
            ["Fee", coinbase ? <span className="muted">coinbase, no fee</span> : fee !== undefined ? <span className="mono">{sompiToKls(fee)} KLS</span> : <span className="muted">unknown (inputs not resolved)</span>],
            ["Mass", <span className="mono">{t.mass ?? "—"}</span>],
            ["Included in", <ul className="hash-list">{t.block_hash.map((h) => <li key={h}><BlockLink hash={h} short={false} /></li>)}</ul>],
            [
              "Accepting block",
              t.accepting_block_hash ? (
                <>
                  <BlockLink hash={t.accepting_block_hash} short={false} />
                  {t.accepting_block_blue_score !== null ? (
                    <div className="muted small mono">blue score {groupInt(t.accepting_block_blue_score)}</div>
                  ) : null}
                </>
              ) : (
                <span className="muted">—</span>
              ),
            ],
          ]}
        />
      </section>

      <section className="io-grid">
        <article className="card">
          <div className="card-head">
            <h2>Inputs ({t.inputs?.length ?? 0})</h2>
          </div>
          <div className="table-scroll">
            <table className="data">
              <tbody>
                {coinbase || !t.inputs?.length ? (
                  <tr className="empty-row">
                    <td>Coinbase: newly minted coins, no inputs.</td>
                  </tr>
                ) : (
                  t.inputs.map((i) => (
                    <tr key={`${i.previous_outpoint_hash}:${i.previous_outpoint_index}`}>
                      <td>
                        {i.previous_outpoint_address ? (
                          <AddressLink address={i.previous_outpoint_address} tag={tags[withPrefix(i.previous_outpoint_address)]} />
                        ) : (
                          <span className="muted">unresolved</span>
                        )}
                        <div className="small">
                          <TxLink id={i.previous_outpoint_hash} /> <span className="muted">#{i.previous_outpoint_index}</span>
                        </div>
                      </td>
                      <td className="num">
                        {i.previous_outpoint_amount !== null ? (
                          <>
                            {sompiToKls(toBigInt(i.previous_outpoint_amount))} <span className="muted">KLS</span>
                          </>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
        <article className="card">
          <div className="card-head">
            <h2>Outputs ({t.outputs?.length ?? 0})</h2>
          </div>
          <div className="table-scroll">
            <table className="data">
              <tbody>
                {(t.outputs ?? []).map((o) => (
                  <tr key={o.index}>
                    <td>
                      <span className="muted mono">#{o.index} </span>
                      {o.script_public_key_address ? (
                        <AddressLink address={o.script_public_key_address} tag={tags[withPrefix(o.script_public_key_address)]} />
                      ) : (
                        <span className="muted">{o.script_public_key_type}</span>
                      )}
                    </td>
                    <td className="num">
                      {sompiToKls(toBigInt(o.amount))} <span className="muted">KLS</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </>
  );
}

export function TxPage() {
  const { id = "" } = useParams();
  const { data, error, loading } = useFetch(`tx:${id}`, (s) => api.transaction(id, s));
  return (
    <>
      <PageTitle eyebrow="Transaction" title={<span className="mono break title-hash">{id}</span>} />
      {data && data.transaction_id === id ? <TxView t={data} /> : <LoadState error={error} loading={loading} what="Transaction" />}
    </>
  );
}
