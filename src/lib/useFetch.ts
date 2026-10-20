import { useEffect, useState } from "react";

export interface FetchState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

/**
 * Load once per `key`. Aborts the previous request when the key changes, keeps
 * the previous data visible while the next page loads (no layout jump).
 */
export function useFetch<T>(key: string, fn: (signal: AbortSignal) => Promise<T>): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ data: undefined, error: undefined, loading: true });

  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ ...s, error: undefined, loading: true }));
    fn(ctrl.signal).then(
      (data) => setState({ data, error: undefined, loading: false }),
      (error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState((s) => ({ ...s, error: error as Error, loading: false }));
      },
    );
    return () => ctrl.abort();
    // `fn` is recreated on every render; `key` identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
