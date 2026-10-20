import { useState } from "react";
import { BlockDagCard, MarketCard, RewardCard, SupplyCard } from "../components/StatCards";
import { LatestBlocks, LatestTransactions } from "../components/LiveTables";
import { SearchBox } from "../components/SearchBox";
import { useAddressTags } from "../lib/tags";
import { useLiveBlocks } from "../live/useLiveBlocks";

const HIDE_COINBASE_KEY = "kls.hideCoinbase";

function readHideCoinbase(): boolean {
  try {
    return localStorage.getItem(HIDE_COINBASE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function Dashboard() {
  const [paused, setPaused] = useState(false);
  const [hideCoinbase, setHideCoinbase] = useState(readHideCoinbase);
  const live = useLiveBlocks(paused);
  const tags = useAddressTags();

  const toggleCoinbase = () =>
    setHideCoinbase((v) => {
      try {
        localStorage.setItem(HIDE_COINBASE_KEY, v ? "0" : "1");
      } catch {
        // Storage unavailable (private mode); the toggle still works for this visit.
      }
      return !v;
    });

  const statusLabel =
    paused ? "paused" : live.status === "live" ? "live" : live.status === "degraded" ? "reconnecting" : "connecting";

  return (
    <>
      <section className="hero">
        <div className="live-line">
          <span className={`dot ${!paused && live.status === "live" ? "live" : live.status === "degraded" ? "degraded" : ""}`} aria-hidden="true" />
          <span className="eyebrow">karlsen-mainnet · {statusLabel}</span>
        </div>
        <div className="hero-title">
          <img src="/karlsen-logo.png" alt="Karlsen logo" width="72" height="72" className="hero-logo" />
          <h1>Explore the Karlsen BlockDAG</h1>
        </div>
        <SearchBox />
      </section>

      <section className="stat-grid" aria-label="Network summary">
        <SupplyCard />
        <RewardCard />
        <BlockDagCard />
        <MarketCard />
      </section>

      <section className="live-grid" aria-label="Live activity">
        <LatestBlocks blocks={live.blocks} paused={paused} onTogglePause={() => setPaused((p) => !p)} />
        <LatestTransactions
          txs={live.txs}
          tags={tags}
          hideCoinbase={hideCoinbase}
          onToggleCoinbase={toggleCoinbase}
          paused={paused}
          onTogglePause={() => setPaused((p) => !p)}
        />
      </section>
    </>
  );
}
