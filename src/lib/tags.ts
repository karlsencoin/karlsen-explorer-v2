import { useEffect, useState } from "react";
import { withPrefix } from "./address";

// Address tags are loaded at runtime from /address-tags.json, so adding a tag
// is a file edit on the server, not a rebuild.

export type TagMap = Record<string, string>;

let cache: Promise<TagMap> | null = null;

function loadTags(): Promise<TagMap> {
  if (!cache) {
    cache = fetch("/address-tags.json", { cache: "no-cache" })
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
