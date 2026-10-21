import { useEffect, useRef, useState } from "react";

export interface PollState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

/** First retry after a failure; doubles each time, capped at the poll interval. */
const RETRY_START_MS = 2_000;

/**
 * Run `fn` now and every `intervalMs`. Keeps the last good value on error.
 *
 * - The first load runs even when the page opens in a background tab, so the
 *   numbers are there when the visitor switches to it.
 * - A failed request is retried quickly (2 s, 4 s, 8 s, ... up to the interval)
 *   instead of leaving the card empty until the next regular tick.
 * - While the tab is hidden, regular polling pauses; on return it refreshes at
 *   once if the value is missing or older than one interval.
 * - In-flight requests are aborted on unmount.
 */
export function usePoll<T>(fn: (signal: AbortSignal) => Promise<T>, intervalMs: number): PollState<T> {
  const [state, setState] = useState<PollState<T>>({ data: undefined, error: undefined, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let timer: number | undefined;
    let ctrl: AbortController | undefined;
    let stopped = false;
    let running = false;
    let hasData = false;
    let lastSuccess = 0;
    let retryMs = RETRY_START_MS;

    const schedule = (ms: number) => {
      window.clearTimeout(timer);
      if (!stopped) timer = window.setTimeout(tick, ms);
    };

    const tick = async (force = false) => {
      if (running || stopped) return;
      // Pause regular polling in hidden tabs, but never skip the first load.
      if (document.hidden && hasData && !force) {
        schedule(intervalMs);
        return;
      }
      running = true;
      ctrl = new AbortController();
      try {
        const data = await fnRef.current(ctrl.signal);
        if (stopped) return;
        hasData = true;
        lastSuccess = Date.now();
        retryMs = RETRY_START_MS;
        setState({ data, error: undefined, loading: false });
        schedule(intervalMs);
      } catch (e) {
        if (stopped || (e instanceof DOMException && e.name === "AbortError")) return;
        setState((s) => ({ ...s, error: e as Error, loading: false }));
        schedule(Math.min(retryMs, intervalMs));
        retryMs = Math.min(retryMs * 2, intervalMs);
      } finally {
        running = false;
      }
    };

    const onVisible = () => {
      if (document.hidden) return;
      if (!hasData || Date.now() - lastSuccess >= intervalMs) {
        window.clearTimeout(timer);
        void tick(true);
      }
    };

    void tick(true);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      ctrl?.abort();
    };
  }, [intervalMs]);

  return state;
}
