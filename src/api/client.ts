import type {
  Block,
  BlockDagInfo,
  BlockReward,
  CoinSupply,
  Halving,
  Hashrate,
  KarlsendInfo,
  MarketData,
} from "./types";

export const API_BASE: string = (import.meta.env.VITE_API_BASE ?? "https://api.karlsencoin.org").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** GET a JSON resource; non-2xx responses become ApiError instead of silent empties. */
export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: string; error?: string };
      detail = body.detail ?? body.error ?? detail;
    } catch {
      // Body was not JSON; keep the status text.
    }
    throw new ApiError(res.status, path, `${res.status} ${detail}`);
  }
  return (await res.json()) as T;
}

export const api = {
  blockdag: (s?: AbortSignal) => getJson<BlockDagInfo>("/info/blockdag", s),
  coinsupply: (s?: AbortSignal) => getJson<CoinSupply>("/info/coinsupply", s),
  blockreward: (s?: AbortSignal) => getJson<BlockReward>("/info/blockreward", s),
  halving: (s?: AbortSignal) => getJson<Halving>("/info/halving", s),
  karlsend: (s?: AbortSignal) => getJson<KarlsendInfo>("/info/karlsend", s),
  hashrate: (s?: AbortSignal) => getJson<Hashrate>("/info/hashrate", s),
  marketData: (s?: AbortSignal) => getJson<MarketData>("/info/market-data", s),
  block: (hash: string, includeTransactions = true, s?: AbortSignal) =>
    getJson<Block>(
      `/blocks/${encodeURIComponent(hash)}?includeTransactions=${includeTransactions ? "true" : "false"}`,
      s,
    ),
};
