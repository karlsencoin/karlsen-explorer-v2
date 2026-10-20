import { useEffect, useState } from "react";

/** Current time in ms, refreshed every `stepMs` (for "3s ago" style cells). */
export function useNow(stepMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), stepMs);
    return () => window.clearInterval(t);
  }, [stepMs]);
  return now;
}
