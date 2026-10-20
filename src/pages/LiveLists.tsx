import { useState } from "react";
import { LatestBlocks, LatestTransactions } from "../components/LiveTables";
import { PageTitle } from "../components/Common";
import { useAddressTags } from "../lib/tags";
import { useLiveBlocks } from "../live/useLiveBlocks";

// Full-width live lists behind "View all". They show the stream's recent window;
// historical browsing goes through block, transaction and address pages.

export function BlocksPage() {
  const [paused, setPaused] = useState(false);
  const live = useLiveBlocks(paused, 50);
  return (
    <>
      <PageTitle eyebrow="Live" title="Latest blocks" />
      <LatestBlocks blocks={live.blocks} paused={paused} onTogglePause={() => setPaused((p) => !p)} rows={50} />
    </>
  );
}

export function TxsPage() {
  const [paused, setPaused] = useState(false);
  const [hideCoinbase, setHideCoinbase] = useState(false);
  const live = useLiveBlocks(paused, 50);
  const tags = useAddressTags();
  return (
    <>
      <PageTitle eyebrow="Live" title="Latest transactions" />
      <LatestTransactions
        txs={live.txs}
        tags={tags}
        hideCoinbase={hideCoinbase}
        onToggleCoinbase={() => setHideCoinbase((v) => !v)}
        paused={paused}
        onTogglePause={() => setPaused((p) => !p)}
        rows={100}
      />
    </>
  );
}
