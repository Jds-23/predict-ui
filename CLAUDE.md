# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server on port 3000
npm run build        # production build (vite + tsc)
npm run test         # run vitest
npm run lint         # biome lint
npm run format       # biome format
npm run check        # biome check (lint + format)
```

Add shadcn components:
```bash
pnpm dlx shadcn@latest add <component>
```

## Architecture

**Stack:** React 19, TanStack Router (file-based), TanStack Query, Tailwind v4, Vite, Biome

**Path alias:** `@/*` → `./src/*`

### Registry Pattern (shadcn-style)

`registry/price-graph/` - installable component library with:
- `components/` - UI components (kebab-case)
- `hooks/` - React hooks
- `adapters/` - data source plugins (PriceAdapter interface)
- `lib/types.ts` - shared types
- `registry.json` - component manifest

CLI: `node scripts/add.ts price-graph` copies files to user paths

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

## Code Style

- Biome: tabs, double quotes
- Strict TypeScript
