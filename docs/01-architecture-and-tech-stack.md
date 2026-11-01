# 01 — Architecture & Tech Stack Specification

## 1. Guiding Principles

1. **100% Free-Tier Cloud Infrastructure**: Zero monthly fixed costs. Designed for personal usage (hundreds of requests/month) and effortless open-source self-hosting on Cloudflare's free plan.
2. **Offline-First ("SQLite-Everywhere")**: Every workout log, routine edit, and meal entry writes immediately to a local on-device SQLite database in `<1ms`—never blocked by gym dead zones or network latency.
3. **Zero-Cost Interactive Web Demo**: Unauthenticated visitors can click **"Try Demo"** and use the full web application backed by their browser's local OPFS SQLite database pre-seeded with realistic workouts, routines, weight trends, and meals.
4. **Single SQLite Dialect Across Web, Cloud, and Apple Platforms**:
   - **Cloud**: Cloudflare D1 (SQLite) + Drizzle ORM
   - **Web**: `@sqlite.org/sqlite-wasm` (OPFS `opfs-sahpool` VFS in a Web Worker) + Drizzle ORM
   - **iOS & watchOS**: `SQLiteData` (`GRDB.swift`) running the exact same SQLite schema & FTS5 tables

---

## 2. Monorepo Structure (`pnpm` Workspaces)

```text
gains/
├── apps/
│   ├── web/                  # React 19 SPA + Vite + Tailwind v4 + Shadcn (Base UI) + TanStack Router
│   └── api/                  # Cloudflare Worker (Hono RPC + Better Auth + D1 Sync + Remote MCP)
├── packages/
│   ├── db/                   # Shared Drizzle ORM SQLite schema, SQL migrations, FTS5 setup & seed data
│   ├── shared/               # Shared Zod schemas, Progression math, 1RM/Fatigue, Trend Weight & TDEE
│   └── mcp/                  # Local STDIO & HTTP Model Context Protocol (MCP) server
├── ios/
│   ├── Gains/                # Native iOS SwiftUI app (SQLiteData / GRDB.swift, HealthKit, ActivityKit)
│   ├── GainsWatch/           # Native watchOS companion app (Digital Crown, Haptics, HKWorkoutSession)
│   └── fitness-wrapped/      # Existing Fitness Wrapped source to be integrated in v1.3
├── catalog/
│   ├── exercises/            # 6,554 JSON files (5,632 base exercises + 922 female variants)
│   └── media/                # 46 MB still/*.webp + 170 MB clip/*.mp4 (served lazily from R2 in v1.4)
├── scripts/
│   └── build-catalog.ts      # Compiles catalog/exercises/*.json into a compact SQLite/JSON seed bundle
└── docs/                     # Architectural & product specifications + Linear ticket breakdown
```

---

## 3. Detailed Technology Stack

### Frontend (`apps/web`)
- **Framework**: React 19 SPA + TypeScript + Vite
- **Routing**: `@tanstack/react-router` (type-safe file-based routing with search param validation via `zod`)
- **UI Primitives & Styling**:
  - **Tailwind CSS v4** with semantic theme tokens, restrained neutral surfaces, independent appearance (System/Light/Dark) and color preset (Factor/Open) preferences, and tabular numeric typography (`font-variant-numeric: tabular-nums`). Desktop and iPhone use distinct compositions governed by [the design language specification](08-design-language.md).
  - **Shadcn UI (built on `@base-ui/react`)** for accessible dialogs, sheets, popovers, comboboxes, and menus.
  - **Motion (`motion/react`)** for smooth iOS-style bottom drawers, workout player transitions, and Fitness Wrapped story slides.
- **Data Visualization**:
  - **Shadcn Charts (Recharts)** with custom SVG `<linearGradient>` fills for iOS Health-style area, line, bar, and radar charts.
  - **Custom Interactive SVG Components** for the 17-region Front/Back Anatomical Muscle Map and the 52-week GitHub-style Workout Activity Heatmap.

### Local Web Persistence (`packages/db` + `apps/web`)
- **Engine**: `@sqlite.org/sqlite-wasm` running inside a dedicated Web Worker.
- **VFS (Virtual File System)**: Uses the **`opfs-sahpool` (Origin Private File System SyncAccessHandle Pool)** VFS.
  - *Why `opfs-sahpool`?* Unlike `SharedArrayBuffer` VFS modes, `opfs-sahpool` works across Chrome, Safari (macOS/iOS), and Firefox **without requiring `Cross-Origin-Embedder-Policy (COEP)` or `Cross-Origin-Opener-Policy (COOP)` headers**, so external images and resources never break.
- **Query Layer**: `drizzle-orm/sqlite-proxy` communicating with the SQLite Web Worker via structured RPC messages, wrapped in a reactive `useLiveSQLiteQuery(query, depsTables)` hook that automatically re-runs whenever a mutation touches one of the subscribed tables.

### Cloud Backend & Hosting (`apps/api`)
- **Compute & Static Hosting**: **Cloudflare Workers** with Static Assets (`wrangler.toml`). Serves the Vite SPA and `/api/*` routes from the same origin (zero CORS issues, zero cold starts).
- **API Framework**: **Hono** (`hono` + `@hono/zod-openapi`) providing:
  - End-to-end type-safe RPC client (`hc`) for `apps/web`
  - Auto-generated **OpenAPI 3.1 spec** (`/api/openapi.json`) for ChatGPT Custom GPT Actions and iOS Swift client generation
- **Database**: **Cloudflare D1 (Serverless SQLite)**
  - Free Tier Quotas: 5,000,000 rows read/day, 100,000 rows written/day, 5 GB total storage, never pauses on inactivity.
- **Object Storage**: **Cloudflare R2**
  - Free Tier Quotas: 10 GB storage/month, 1,000,000 Class A (write) ops/month, 10,000,000 Class B (read) ops/month, **zero egress bandwidth fees**.
  - Used in `v1.4` for exercise media (`still/<id>.webp`, `clip/<id>.mp4`) and in `v1.5` for private, EXIF-stripped progress photos.
- **Authentication**: **Better Auth** (`better-auth` with Drizzle D1 adapter)
  - Supports **Passkeys (`@better-auth/passkey`)** (Face ID / Touch ID / Windows Hello), Email + Password, and **Bearer API Tokens** (`@better-auth/api-key`) so users can connect Claude/ChatGPT/Gemini or the iOS app.

### Code Quality, Testing & CI/CD
- **Linter & Formatter**: **Oxc** (`oxlint` + `oxfmt`) for millisecond-speed linting and formatting.
- **Testing**: **Vitest** for unit testing progression algorithms, 1RM formulas, muscle volume calculations, Trend Weight EWMA, Dynamic TDEE math, and HLC sync merging.
- **CI/CD**: **GitHub Actions** workflow running on every PR and `main` push:
  1. `pnpm oxlint` & `pnpm oxfmt --check`
  2. `pnpm typecheck` (`tsc --noEmit`)
  3. `pnpm test` (`vitest run`)
  4. `wrangler d1 migrations apply` & `wrangler deploy` (on merge to `main`)

---

## 4. Git & Pull Request Conventions

Every task and PR in this repository follows strict conventions:
- **Branch Naming**: Always include the Linear ticket ID in the branch name (e.g., `ENG-101-monorepo-setup` or `feature/ENG-104-active-workout-player`).
- **PR Title**: Short and in an affirmative/imperative voice (e.g., `Add active workout rest timer`, `Implement dynamic TDEE calculator`). Leave the Linear ticket ID out of the PR title.
- **PR Description**: Concise, descriptive, and memorable summary of the change. Leave Linear ticket references out of the PR body and do not include a "Verification" section.
