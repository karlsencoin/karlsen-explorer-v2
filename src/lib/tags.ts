import { useEffect, useState } from "react";
import { withPrefix } from "./address";
import { API_BASE } from "../api/client";

// Address tags are loaded at runtime from /address-tags.json, so adding a tag
// is a file edit on the server, not a rebuild. Exchange tags that follow a hot
// wallet's change outputs come from the API (/analytics/address-tags/auto);
// a hand-written tag always wins over a derived one.

export type TagMap = Record<string, string>;

let cache: Promise<TagMap> | null = null;

function fetchTagFile(url: string): Promise<TagMap> {
  return fetch(url, { cache: "no-cache" })
    .then((r) => (r.ok ? (r.json() as Promise<unknown>) : {}))
    .then((raw) => {
      const out: TagMap = {};
      if (raw && typeof raw === "object") {
        for (const [k, v] of Object.entries(raw)) if (typeof v === "string") out[withPrefix(k)] = v;
      }
      return out;
    })
    .catch(() => ({}));
}

function loadTags(): Promise<TagMap> {
  if (!cache) {
    cache = Promise.all([
      fetchTagFile(`${API_BASE}/analytics/address-tags/auto`),
      fetchTagFile("/address-tags.json"),
    ]).then(([auto, manual]) => ({ ...auto, ...manual }));
  }
  return cache;
}

export function useAddressTags(): TagMap {
  const [tags, setTags] = useState<TagMap>({});
  useEffect(() => {
    let alive = true;
    loadTags().then((t) => alive && setTags(t));
    return () => {
      alive = false;
    };
  }, []);
  return tags;
}
