import { Link } from "react-router-dom";
import { shortAddress, withPrefix } from "../lib/address";
import { shortHash } from "../lib/format";
import { tagExplanation, type TagInfo } from "../lib/tags";

export function BlockLink({ hash, short = false }: { hash: string; short?: boolean }) {
  return (
    <Link to={`/blocks/${hash}`} title={hash} className="mono">
      {short ? shortHash(hash) : hash}
    </Link>
  );
}

export function TxLink({ id, short = false }: { id: string; short?: boolean }) {
  return (
    <Link to={`/txs/${id}`} title={id} className="mono">
      {short ? shortHash(id, 10, 8) : id}
    </Link>
  );
}

/** Owner badge: colour by category, dashed when the tag is an unproven guess. */
export function TagBadge({ tag }: { tag: string | TagInfo }) {
  if (typeof tag === "string") return <span className="tag neutral">{tag}</span>;
  const unproven = tag.source === "derived-unconfirmed";
  return (
    <span className={`tag cat-${tag.category}${unproven ? " unproven" : ""}`} title={tagExplanation(tag)}>
      {tag.entity}
      {tag.role ? <span className="tag-role"> · {tag.role}</span> : null}
      {unproven ? <span className="tag-role"> · unconfirmed</span> : null}
      {tag.source === "derived" ? <span className="tag-role"> · linked</span> : null}
    </span>
  );
}

export function AddressLink({ address, tag, short = false }: { address: string; tag?: string | TagInfo; short?: boolean }) {
  if (!address) return <span className="muted">—</span>;
  const full = withPrefix(address);
  return (
    <>
      <Link to={`/addresses/${full}`} title={full} className="mono addr">
        {short ? shortAddress(full) : full}
      </Link>
      {tag ? <TagBadge tag={tag} /> : null}
    </>
  );
}
