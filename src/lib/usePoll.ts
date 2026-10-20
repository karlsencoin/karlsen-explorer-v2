import { useEffect, useRef, useState } from "react";

export interface PollState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

/**
 * Run `fn` now and every `intervalMs`. Keeps the last good value on error,
 * pauses while the tab is hidden, and aborts in-flight requests on unmount.
 */
export function usePoll<T>(fn: (signal: AbortSignal) => Promise<T>, intervalMs: number): PollState<T> {
  const [state, setState] = useState<PollState<T>>({ data: undefined, error: undefined, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let timer: number | undefined;
    let ctrl: AbortController | undefined;
    let stopped = false;

    const tick = async () => {
      if (document.hidden) {
        schedule();
        return;
      }
      ctrl = new AbortController();
      try {
        const data = await fnRef.current(ctrl.signal);
        if (!stopped) setState({ data, error: undefined, loading: false });
      } catch (e) {
        if (stopped || (e instanceof DOMException && e.name === "AbortError")) return;
        setState((s) => ({ ...s, error: e as Error, loading: false }));
      }
      schedule();
    };
    const schedule = () => {
      if (!stopped) timer = window.setTimeout(tick, intervalMs);
    };

    tick();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      ctrl?.abort();
    };
  }, [intervalMs]);

  return state;
}
