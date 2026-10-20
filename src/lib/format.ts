// Formatting helpers. Amounts stay integer (bigint sompi) until display.

export const SOMPI_PER_KLS = 100_000_000n;

export function toBigInt(v: string | number | bigint): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(Math.trunc(v));
  return BigInt(v.trim() || "0");
}

const groupFmt = new Intl.NumberFormat("en-US");

/** Group an integer with thousands separators: 93325405 -> "93,325,405". */
export function groupInt(v: string | number | bigint): string {
  return groupFmt.format(toBigInt(v));
}

/**
 * Format a sompi amount as KLS. `decimals` caps fractional digits;
 * trailing zeros are trimmed unless `fixed` is set.
 */
export function sompiToKls(sompi: string | number | bigint, decimals = 8, fixed = false): string {
  const v = toBigInt(sompi);
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const whole = abs / SOMPI_PER_KLS;
  let frac = (abs % SOMPI_PER_KLS).toString().padStart(8, "0").slice(0, decimals);
  if (!fixed) frac = frac.replace(/0+$/, "");
  const out = groupFmt.format(whole) + (frac ? `.${frac}` : "");
  return neg ? `-${out}` : out;
}

/** Percentage of a/b with two decimals, computed in integers. */
export function percent(a: bigint, b: bigint): string {
  if (b === 0n) return "0.00";
  const bp = (a * 10_000n) / b; // basis points
  return `${bp / 100n}.${(bp % 100n).toString().padStart(2, "0")}`;
}

/** Hashrate given in TH/s, scaled to the most readable unit. */
export function formatHashrate(ths: number): string {
  const units = ["H/s", "KH/s", "MH/s", "GH/s", "TH/s", "PH/s", "EH/s"];
  let v = ths * 1e12;
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return `${v.toFixed(2)} ${units[i]}`;
}

export function formatUsd(v: number, maxDecimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: Math.min(2, maxDecimals),
  }).format(v);
}

export function formatCompactUsd(v: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(v);
}

export function formatSignedPercent(v: number): string {
  const s = v > 0 ? "+" : "";
  return `${s}${v.toFixed(2)}%`;
}

/** "3s", "4m 12s", "2h 05m", "3d 4h" relative to now. */
export function formatAge(fromMs: number, nowMs: number = Date.now()): string {
  const s = Math.max(0, Math.floor((nowMs - fromMs) / 1000));
  return formatDuration(s);
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${String(m % 60).padStart(2, "0")}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

/** UTC timestamp "2026-10-20 10:22:37". */
export function formatUtc(ms: number): string {
  return new Date(ms).toISOString().replace("T", " ").slice(0, 19);
}

/** Shorten a hash for tight cells: keeps `head` + `tail` characters. */
export function shortHash(h: string, head = 12, tail = 10): string {
  return h.length <= head + tail + 1 ? h : `${h.slice(0, head)}…${h.slice(-tail)}`;
}

/** Local time "2026-10-20 13:18:06" in the viewer's time zone (as the legacy explorer showed). */
export function formatLocal(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
