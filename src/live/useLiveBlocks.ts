import { useEffect, useRef, useState } from "react";
import { defaultFeed, type FeedStatus, type LiveBlock, type LiveFeed, type LiveTx } from "./feed";

export interface LiveState {
  blocks: LiveBlock[]; // newest first
  txs: LiveTx[]; // newest first
  status: FeedStatus;
}

/**
 * Keeps the newest `keep` blocks and transactions from the feed.
 * While `paused`, incoming data is buffered and applied on resume, so the
 * visible rows stop moving but nothing is lost.
 */
export function useLiveBlocks(paused: boolean, keep = 20, feed: LiveFeed = defaultFeed): LiveState {
  const [state, setState] = useState<LiveState>({ blocks: [], txs: [], status: "connecting" });
  const pending = useRef<LiveBlock[]>([]);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const apply = (incoming: LiveBlock[]) => {
    setState((s) => {
      const known = new Set(s.blocks.map((b) => b.hash));
      const fresh = incoming.filter((b) => !known.has(b.hash));
      if (!fresh.length) return s;
      const newestFirst = [...fresh].reverse();
      const txs = newestFirst.flatMap((b) => [...b.txs].reverse());
      return {
        ...s,
        blocks: [...newestFirst, ...s.blocks].slice(0, keep),
        txs: [...txs, ...s.txs].slice(0, keep * 5),
      };
    });
  };

  useEffect(
    () =>
      feed.subscribe(
        (blocks) => {
          if (pausedRef.current) pending.current.push(...blocks);
          else apply(blocks);
        },
        (status) => setState((s) => (s.status === status ? s : { ...s, status })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [feed, keep],
  );

  useEffect(() => {
    if (!paused && pending.current.length) {
      const buffered = pending.current;
      pending.current = [];
      apply(buffered);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  return state;
}
