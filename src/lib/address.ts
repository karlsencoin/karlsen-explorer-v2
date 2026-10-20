// Address and search-input handling.
// Rule carried over from the legacy explorer: addresses are always shown and linked
// with the "karlsen:" prefix; comparisons strip it on both sides.

export const ADDRESS_PREFIX = "karlsen:";

export function withPrefix(addr: string): string {
  const a = addr.trim();
  return a.startsWith(ADDRESS_PREFIX) ? a : ADDRESS_PREFIX + a;
}

export function withoutPrefix(addr: string): string {
  return addr.trim().replace(/^karlsen:/, "");
}

export function sameAddress(a: string, b: string): boolean {
  return withoutPrefix(a) === withoutPrefix(b);
}

// Bech32 charset (no 1, b, i, o). Payload length check is loose on purpose; the API validates.
const ADDRESS_BODY = /^[qpr][023456789acdefghjklmnpqrstuvwxyz]{50,100}$/;
const HEX64 = /^[0-9a-f]{64}$/i;

export type SearchTarget =
  | { kind: "address"; value: string }
  | { kind: "hash"; value: string } // block hash or transaction id; resolved by trying both
  | { kind: "invalid"; value: string };

export function classifySearch(input: string): SearchTarget {
  const v = input.trim();
  if (!v) return { kind: "invalid", value: v };
  if (HEX64.test(v)) return { kind: "hash", value: v.toLowerCase() };
  if (ADDRESS_BODY.test(withoutPrefix(v))) return { kind: "address", value: withPrefix(v) };
  return { kind: "invalid", value: v };
}

/** Shorten an address keeping the prefix: "karlsen:qpeusc8t…sfu6g". */
export function shortAddress(addr: string, head = 8, tail = 6): string {
  const body = withoutPrefix(addr);
  if (body.length <= head + tail + 1) return withPrefix(body);
  return `${ADDRESS_PREFIX}${body.slice(0, head)}…${body.slice(-tail)}`;
}
