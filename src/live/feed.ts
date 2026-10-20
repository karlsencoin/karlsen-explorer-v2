import { api } from "../api/client";
import type { Block } from "../api/types";
import { toBigInt } from "../lib/format";

// Live block/transaction stream.
//
// The UI only depends on the LiveFeed interface. Today the only implementation
// polls /info/blockdag tips; once karlsen-explorer-api exposes its streaming
// endpoint, an SSE-backed feed replaces it without touching components.

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
  isChainBlock: boolean;
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

export const defaultFeed: LiveFeed = new PollingFeed();
