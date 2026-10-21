# karlsen-explorer-v2

The new Karlsen BlockDAG explorer for [explorer.karlsencoin.org](https://explorer.karlsencoin.org).
It replaces the legacy React (CRA) explorer and reads all data from
[karlsen-explorer-api](https://github.com/karlsencoin/karlsen-explorer-api).

Stack: Vite + React 18 + TypeScript. No UI framework; design tokens follow Karlsen AI (ai.karlsencoin.org): navy palette, Sora headings, Inter body text and JetBrains Mono for addresses and numbers, dark and light themes.

## Status

| Page | State |
| --- | --- |
| Dashboard (supply, reward, BlockDAG, market, live blocks/txs) | done |
| Blocks (live list), Block detail | done |
| Transactions (live list), Transaction detail | done |
| Address (balance, paged history, paged UTXOs) | done |
| Distribution (tiers, rich list, tier pages) | done |
| wKLS Bridge (proof of reserves) | done |

Legacy URLs (`/blocks/:id/:txview`, `/range/:tier`) keep resolving.

## Development

```bash
npm ci
cp .env.example .env    # optional; defaults to https://api.karlsencoin.org
npm run dev             # http://localhost:5173
npm run build           # type-check + production build into dist/
```

## Live data

Components consume the `LiveFeed` interface (`src/live/feed.ts`).
The default `SseFeed` reads `/live/stream` from karlsen-explorer-api: the API holds one
node subscription for all viewers and sends blocks in batches, which keeps working
at 10 BPS. `PollingFeed` (polls `/info/blockdag` tips) is kept as a fallback:
build with `VITE_LIVE_MODE=poll`.

## Address tags

Exchange and bridge address labels live in `public/address-tags.json` and are fetched
at runtime. On the server, edit `dist/address-tags.json` directly; no rebuild needed.

## Conventions

- Amounts are handled as integer sompi (`bigint`) and only formatted for display.
- Addresses are always shown and linked with the `karlsen:` prefix; comparisons strip it.
- API errors surface as errors; the UI keeps the last good value and says so.

## Deploy

The build output is static. nginx serves `dist/` with an SPA fallback:

```nginx
location / {
    try_files $uri /index.html;
}
```

## License

MIT
