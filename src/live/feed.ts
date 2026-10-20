import { api, API_BASE } from "../api/client";
import type { Block } from "../api/types";
import { toBigInt } from "../lib/format";

// Live block/transaction stream.
//
// The UI only depends on the LiveFeed interface. The default is SseFeed, which
// reads karlsen-explorer-api's /live/stream (one shared node subscription on the
// server, batched blocks). PollingFeed remains as a fallback (VITE_LIVE_MODE=poll).

export interface LiveTx {
  id: string;
  blockHash: string;
  timeMs: number;
  amountSompi: bigint; // sum of outputs
  to: string; // first output address
  outputs: number;
  coinbase: boolean;
}

export interface LiveBlock {
  hash: string;
  timeMs: number;
  blueScore: bigint;
  daaScore: bigint;
  txCount: number;
  /** Unknown (undefined) for blocks from the stream: chain status is decided later. */
  isChainBlock?: boolean;
  txs: LiveTx[];
}

export type FeedStatus = "connecting" | "live" | "degraded";

export interface LiveFeed {
  /** Delivers batches of new blocks, oldest first. Returns an unsubscribe function. */
  subscribe(onBlocks: (blocks: LiveBlock[]) => void, onStatus: (s: FeedStatus) => void): () => void;
}

export function toLiveBlock(b: Block): LiveBlock {
  const hash = b.verboseData.hash;
  const timeMs = Number(b.header.timestamp);
  const txs: LiveTx[] = (b.transactions ?? []).map((t) => ({
    id: t.verboseData.transactionId,
    blockHash: hash,
    timeMs,
    amountSompi: t.outputs.reduce((acc, o) => acc + toBigInt(o.amount), 0n),
    to: t.outputs[0]?.verboseData.scriptPublicKeyAddress ?? "",
    outputs: t.outputs.length,
    coinbase: t.inputs.length === 0,
  }));
  return {
    hash,
    timeMs,
    blueScore: toBigInt(b.header.blueScore),
    daaScore: toBigInt(b.header.daaScore),
    txCount: b.verboseData.transactionIds.length,
    isChainBlock: b.verboseData.isChainBlock,
    txs,
  };
}

/**
 * Interim feed: polls the DAG tips and fetches unseen blocks.
 * Good enough at 1 BPS; the streaming endpoint is required before 10 BPS.
 */
export class PollingFeed implements LiveFeed {
  constructor(
    private readonly intervalMs = 1000,
    private readonly maxFetchPerTick = 10,
  ) {}

  subscribe(onBlocks: (blocks: LiveBlock[]) => void, onStatus: (s: FeedStatus) => void): () => void {
    const seen = new Set<string>();
    const seenOrder: string[] = [];
    let stopped = false;
    let timer: number | undefined;
    let failures = 0;
    onStatus("connecting");

    const remember = (h: string) => {
      seen.add(h);
      seenOrder.push(h);
      if (seenOrder.length > 2000) seen.delete(seenOrder.shift()!);
    };

    const tick = async () => {
      if (stopped) return;
      if (!document.hidden) {
        try {
          const dag = await api.blockdag();
          const candidates = [...new Set([...dag.tipHashes, dag.sink, ...dag.virtualParentHashes])].filter(
            (h) => h && !seen.has(h),
          );
          const batch = candidates.slice(0, this.maxFetchPerTick);
          batch.forEach(remember);
          const blocks = (
            await Promise.allSettled(batch.map((h) => api.block(h, true)))
          ).flatMap((r) => (r.status === "fulfilled" ? [toLiveBlock(r.value)] : []));
          blocks.sort((a, b) => (a.blueScore === b.blueScore ? a.timeMs - b.timeMs : a.blueScore < b.blueScore ? -1 : 1));
          if (!stopped && blocks.length) onBlocks(blocks);
          failures = 0;
          if (!stopped) onStatus("live");
        } catch {
          failures++;
          if (!stopped && failures >= 3) onStatus("degraded");
        }
      }
      if (!stopped) timer = window.setTimeout(tick, this.intervalMs);
    };

    tick();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }
}

// ---- SSE feed ----

interface WireTx {
  id: string;
  amount: string; // sompi
  to: string;
  outputs: number;
  coinbase: boolean;
}

interface WireBlock {
  hash: string;
  timestamp: number; // unix ms
  blueScore: string;
  daaScore: string;
  txCount: number;
  txs: WireTx[];
}

function fromWire(b: WireBlock): LiveBlock {
  return {
    hash: b.hash,
    timeMs: b.timestamp,
    blueScore: toBigInt(b.blueScore),
    daaScore: toBigInt(b.daaScore),
    txCount: b.txCount,
    txs: b.txs.map((t) => ({
      id: t.id,
      blockHash: b.hash,
      timeMs: b.timestamp,
      amountSompi: toBigInt(t.amount),
      to: t.to,
      outputs: t.outputs,
      coinbase: t.coinbase,
    })),
  };
}

function parseBatch(data: string): LiveBlock[] {
  try {
    const parsed = JSON.parse(data) as { blocks?: WireBlock[] };
    return (parsed.blocks ?? []).map(fromWire);
  } catch {
    return [];
  }
}

/**
 * Server-Sent Events from /live/stream. EventSource reconnects by itself;
 * every (re)connect starts with a `snapshot`, duplicates are dropped by hash
 * in useLiveBlocks.
 */
export class SseFeed implements LiveFeed {
  constructor(private readonly url = `${API_BASE}/live/stream`) {}

  subscribe(onBlocks: (blocks: LiveBlock[]) => void, onStatus: (s: FeedStatus) => void): () => void {
    onStatus("connecting");
    const es = new EventSource(this.url);
    const handle = (e: MessageEvent<string>) => {
      onStatus("live");
      const blocks = parseBatch(e.data);
      if (blocks.length) onBlocks(blocks);
    };
    es.addEventListener("snapshot", handle as EventListener);
    es.addEventListener("blocks", handle as EventListener);
    es.onopen = () => onStatus("live");
    es.onerror = () => onStatus(es.readyState === EventSource.CLOSED ? "degraded" : "connecting");
    return () => es.close();
  }
}

export const defaultFeed: LiveFeed =
  import.meta.env.VITE_LIVE_MODE === "poll" || typeof EventSource === "undefined" ? new PollingFeed() : new SseFeed();
