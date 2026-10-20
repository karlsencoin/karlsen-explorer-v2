# karlsen-explorer-v2

The new Karlsen BlockDAG explorer for [explorer.karlsencoin.org](https://explorer.karlsencoin.org).
It replaces the legacy React (CRA) explorer and reads all data from
[karlsen-explorer-api](https://github.com/karlsencoin/karlsen-explorer-api).

Stack: Vite + React 18 + TypeScript. No UI framework; design tokens follow karlsencoin.org.

## Status

| Page | State |
| --- | --- |
| Dashboard (supply, reward, BlockDAG, market, live blocks/txs) | done |
| Blocks, Block detail | next |
| Transactions, Transaction detail | next |
| Address (balance, paginated UTXOs, history) | next |
| Distribution (+ range tiers) | planned |
| wKLS Bridge | planned |

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
The current implementation (`PollingFeed`) polls `/info/blockdag` tips once per second
and fetches unseen blocks. It is an interim solution; a streaming endpoint in
karlsen-explorer-api will replace it before the network moves to 10 BPS.

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
