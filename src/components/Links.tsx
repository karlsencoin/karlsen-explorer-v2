import { Link } from "react-router-dom";
import { shortAddress, withPrefix } from "../lib/address";
import { shortHash } from "../lib/format";

export function BlockLink({ hash, short = true }: { hash: string; short?: boolean }) {
  return (
    <Link to={`/blocks/${hash}`} title={hash} className="mono">
      {short ? shortHash(hash) : hash}
    </Link>
  );
}

export function TxLink({ id, short = true }: { id: string; short?: boolean }) {
  return (
    <Link to={`/txs/${id}`} title={id} className="mono">
      {short ? shortHash(id, 10, 8) : id}
    </Link>
  );
}

export function AddressLink({ address, tag, short = true }: { address: string; tag?: string; short?: boolean }) {
  if (!address) return <span className="muted">—</span>;
  const full = withPrefix(address);
  return (
    <>
      <Link to={`/addresses/${full}`} title={full} className="mono addr">
        {short ? shortAddress(full) : full}
      </Link>
      {tag ? <span className="tag">{tag}</span> : null}
    </>
  );
}
