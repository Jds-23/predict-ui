# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev              # dev server on port 3000
bun run build        # production build (vite + tsc)
bun test             # run vitest
bun lint             # biome lint
bun format           # biome format
bun check            # biome check (lint + format)
```

Add shadcn components:
```bash
bunx shadcn@latest add <component>
```

## Architecture

**Stack:** React 19, TanStack Start (SSR), TanStack Router (file-based), TanStack Query, Tailwind v4, Vite, Biome

**Database:** Cloudflare D1 (SQLite at edge) - only available in production

**Path alias:** `@/*` → `./src/*`

### Registry Pattern (shadcn-style)

`registry/price-graph/` - installable component library with:
- `components/` - UI components (kebab-case)
- `hooks/` - React hooks
- `adapters/` - data source plugins (PriceAdapter interface)
- `lib/types.ts` - shared types
- `registry.json` - component manifest

CLI: `bun scripts/add.ts price-graph` copies files to user paths

### PriceGraph

Real-time price chart with adapter-based data sources:
```tsx
import { PriceGraph, useBinancePrice } from '@/registry/price-graph'
const adapter = useBinancePrice({ symbol: 'btcusdt' })
<PriceGraph adapter={adapter} onBoxSelect={handleSelect} />
```

Or manual data: `<PriceGraph priceData={data} isConnected={true} />`

CSS vars required: `--chart-1`, `--muted-foreground`

### Routing

File-based in `src/routes/`. Layout in `__root.tsx`. TanStack Router auto-generates `routeTree.gen.ts`.

### Server Functions

Server functions in `src/server/staking.ts` use `createServerFn` with D1 middleware.
- Local dev: Falls back to client-side in-memory state
- Production: Uses D1 database for persistence

Key files:
- `src/server.ts` - Server entry point with Cloudflare context
- `src/db/client.ts` - D1 database accessor
- `src/db/schema.sql` - Database schema

## Code Style

- Biome: tabs, double quotes
- Strict TypeScript
