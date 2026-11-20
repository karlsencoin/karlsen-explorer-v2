import { useEffect, useState } from "react";
import { withPrefix } from "./address";
import { API_BASE } from "../api/client";

// Address tags are loaded at runtime from /address-tags.json, so adding a tag
// is a file edit on the server, not a rebuild. Exchange tags that follow a hot
// wallet's change outputs come from the API (/analytics/address-tags/auto);
// a hand-written tag always wins over a derived one.

export type TagMap = Record<string, string>;

/** Where a tag comes from. */
export type TagSource = "manual" | "derived" | "derived-unconfirmed";

export type TagCategory = "exchange" | "pool" | "solo" | "bridge" | "other";

export interface TagInfo {
  /** Label as served (derived guesses end in " (unconfirmed)"). */
  label: string;
  /** Owner the address belongs to, e.g. "NonKYC", "WoolyPooly", "wKLS Bridge". */
  entity: string;
  /** Role of this address inside the entity, e.g. "Hot wallet", "Vault". */
  role: string | null;
  category: TagCategory;
  source: TagSource;
}

export type TagDetails = Record<string, TagInfo>;

/** Suffix the API adds to derived tags not proven by the common-input rule. */
const UNCONFIRMED = " (unconfirmed)";

const ROLE_SUFFIXES: [RegExp, string][] = [
  [/\s+Hot Wallet$/i, "Hot wallet"],
  [/\s+Vault$/i, "Vault"],
];

function categorize(entity: string, label: string): TagCategory {
  if (/^solo miner$/i.test(entity)) return "solo";
  if (/mining pool/i.test(label)) return "pool";
  if (/bridge/i.test(label)) return "bridge";
  if (/^(nonkyc|anonkyc|xeggex|mexc)$/i.test(entity) || /exchange/i.test(label)) return "exchange";
  return "other";
}

export function tagInfo(label: string, from: "manual" | "auto"): TagInfo {
  let base = label;
  let source: TagSource = from === "manual" ? "manual" : "derived";
  if (from === "auto" && base.endsWith(UNCONFIRMED)) {
    base = base.slice(0, -UNCONFIRMED.length);
    source = "derived-unconfirmed";
  }
  let entity = base;
  let role: string | null = null;
  for (const [re, name] of ROLE_SUFFIXES) {
    if (re.test(entity)) {
      entity = entity.replace(re, "");
      role = name;
      break;
    }
  }
  // "WoolyPooly (mining pool)" -> entity "WoolyPooly". Labels such as
  // "Mining pool (Miningcore 2.1.0, operator unknown)" stay whole: the
  // parenthesis is what tells two unknown pools apart.
  const m = /^(.+?)\s+\(mining pool\)$/i.exec(entity);
  if (m) entity = m[1];
  return { label, entity, role, category: categorize(entity, label), source };
}

/** Text for the tag's tooltip: how much the tag can be trusted. */
export function tagExplanation(t: TagInfo): string {
  switch (t.source) {
    case "manual":
      return `${t.entity}: tag verified by hand.`;
    case "derived":
      return `${t.entity}: derived tag. This address was spent in the same transaction as a known ${t.entity} address, so it is controlled by the same keys.`;
    case "derived-unconfirmed":
      return `${t.entity}: unproven guess. This address received the largest output (probably the change) of a ${t.entity} transaction, but it has not yet been spent together with a known ${t.entity} address.`;
  }
}

let cache: Promise<TagDetails> | null = null;

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

function loadTags(): Promise<TagDetails> {
  if (!cache) {
    cache = Promise.all([
      fetchTagFile(`${API_BASE}/analytics/address-tags/auto`),
      fetchTagFile("/address-tags.json"),
    ]).then(([auto, manual]) => {
      const out: TagDetails = {};
      for (const [a, l] of Object.entries(auto)) out[a] = tagInfo(l, "auto");
      // A hand-written tag always wins.
      for (const [a, l] of Object.entries(manual)) out[a] = tagInfo(l, "manual");
      return out;
    });
  }
  return cache;
}

/** Address -> tag details (label, owner, category, how it was derived). */
export function useAddressTags(): TagDetails {
  const [tags, setTags] = useState<TagDetails>({});
  useEffect(() => {
    let alive = true;
    loadTags().then((t) => alive && setTags(t));
    return () => {
      alive = false;
    };
  }, []);
  return tags;
}
