import type {
  AddressBalance,
  Block,
  BlockDagInfo,
  BridgeReserves,
  DistributionSummary,
  RichEntry,
  BlockReward,
  CoinSupply,
  Halving,
  Hashrate,
  KarlsendInfo,
  MarketData,
  TxJson,
  UtxoPage,
  Utxo,
  WalletChain,
  WalletHistory,
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

/** Requests that take longer than this fail with a visible error instead of hanging. */
const TIMEOUT_MS = 45_000;

async function getResponse(path: string, signal?: AbortSignal): Promise<Response> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { signal: combined, headers: { Accept: "application/json" } });
  } catch (e) {
    if (timeout.aborted && !signal?.aborted) throw new ApiError(0, path, `no answer within ${TIMEOUT_MS / 1000} s`);
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(0, path, `network error (${(e as Error).message})`);
  }
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
  return res;
}

/** GET a JSON resource; non-2xx responses become ApiError instead of silent empties. */
export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  return (await (await getResponse(path, signal)).json()) as T;
}

const enc = encodeURIComponent;

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
  transaction: (id: string, s?: AbortSignal) =>
    getJson<TxJson>(`/transactions/${enc(id)}?inputs=true&outputs=true&resolve_previous_outpoints=light`, s),
  addressBalance: (addr: string, s?: AbortSignal) => getJson<AddressBalance>(`/addresses/${enc(addr)}/balance`, s),
  addressTxCount: (addr: string, s?: AbortSignal) =>
    getJson<{ total: number }>(`/addresses/${enc(addr)}/transactions-count`, s),
  addressTxs: (addr: string, limit: number, offset: number, s?: AbortSignal) =>
    getJson<TxJson[]>(
      `/addresses/${enc(addr)}/full-transactions?limit=${limit}&offset=${offset}&resolve_previous_outpoints=light`,
      s,
    ),
  /** Paged UTXOs (newest first); totals come from response headers. */
  addressUtxos: async (addr: string, limit: number, offset: number, s?: AbortSignal): Promise<UtxoPage> => {
    const res = await getResponse(`/addresses/${enc(addr)}/utxos?limit=${limit}&offset=${offset}`, s);
    const items = (await res.json()) as Utxo[];
    const total = Number(res.headers.get("x-total-count") ?? items.length);
    const totalAmount = BigInt(res.headers.get("x-total-amount") ?? "0");
    return { items, total, totalAmount };
  },
  walletChain: (addr: string, s?: AbortSignal) => getJson<WalletChain>(`/addresses/${enc(addr)}/wallet-chain`, s),
  walletHistory: (addr: string, limit: number, offset: number, s?: AbortSignal) =>
    getJson<WalletHistory>(`/addresses/${enc(addr)}/wallet-history?limit=${limit}&offset=${offset}`, s),
  richList: (limit: number, offset: number, s?: AbortSignal) =>
    getJson<{ top_addresses: RichEntry[] }>(`/analytics/addresses/top?limit=${limit}&offset=${offset}`, s).then(
      (r) => r.top_addresses,
    ),
  /** Addresses with min <= balance < max (KLS); max < 0 means no upper bound. */
  range: (minKls: number, maxKls: number, s?: AbortSignal) =>
    getJson<RichEntry[]>(`/analytics/addresses/range?min_amount=${minKls}&max_amount=${maxKls}`, s),
  distributionSummary: (s?: AbortSignal) => getJson<DistributionSummary>("/analytics/addresses/distribution-summary", s),
  bridgeReserves: (s?: AbortSignal) => getJson<BridgeReserves>("/bridge/reserves", s),
};
