# Gains

An open-source, local-first, all-in-one fitness tracker combining science-based gym tracking, physics-based nutrition & adaptive TDEE coaching, rich anatomical & gradient charts, AI/MCP integrations, Fitness Wrapped, and native iOS + Apple Watch apps.

Built to run **100% offline-first** (including a zero-backend-cost **Web Demo Mode**) and hosted entirely on **100% Free-Tier Cloud Infrastructure**.

---

## Run v0.1 locally

Requires Node.js 26.13+ (see `.node-version`) and pnpm 12.16.1 (pinned in `package.json`).

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173`). Use one Gains tab per origin: OPFS SAH pool storage is exclusive. Additional tabs or browsers that restrict OPFS use an explicitly labeled **Memory Fallback**, whose data disappears on reload/close.

Open **Settings → Demo workspace**, then click **Seed Demo Data** to load 10 exercises, 2 routines, 6 completed workouts (90 sets), and 14 days of weight and nutrition records. Today's sample nutrition is **1,200 kcal / 88 g protein**. Seeding replaces existing demo records while preserving preferences; **Reset Demo DB** clears all rows and preferences after confirmation. Settings includes a live inspector of all 19 application tables.

Check **Overview, Train, Nutrition, Progress, and Settings** on desktop and at **390 × 844**. Routines and Exercises are available inside Train; the old `/workout` and `/analytics` URLs redirect to Train and Progress. Switch **Light / Dark / System**, **Factor / Open**, and **lb / kg** in Settings, then refresh and close/reopen the tab to verify persistence. Use **Edit overview** to reorder Training, Weight, and Nutrition. Hover charts to see date/value tooltips; touch pins a selection, and focused charts support Arrow keys, Home, End, and Escape. Open a chart heading for ranges and its accessible data table. Reset and confirm all table counts return to zero. Train, routines, the exercise library, and nutrition browse existing local records; workout logging, routine editing, and food entry remain assigned to their planned releases. The theme/order migration preserves existing data.

Automated checks:

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

Tests run migrations and demo data against the same SQLite WASM engine used by the web app. `packages/db/migrations/*.sql` can also be consumed by D1 and native clients. After generating a new Drizzle migration with `pnpm --filter @gains/db generate`, run `pnpm db:embed` and `pnpm format` to update the browser bundle; the SQL/bundle parity test guards against drift. SQLite query writes should use the worker's transaction-backed `batch` API when multiple statements must commit together. Live queries declare their table subscriptions and additional query dependencies.

The minimal Hono API exposes `/api/health`. After `pnpm build`, `pnpm --filter @gains/api dev` serves the built SPA and API through Wrangler. The demo makes no API calls or cloud sync requests. An already loaded app works without a network connection; offline reload/install support is reserved for a future service worker.

---

## Core Pillars

1. **Gym Tracking & Science-Based Hypertrophy**:
   - **5,632 Base Exercises** (`catalog/exercises/*.json`) with instant SQLite FTS5 search, equipment/category/muscle filters, instructions, and custom exercise support.
   - **Routine Builder & Flexible Scheduling**: Fixed weekday schedules or rolling rotations (`A → B → C`), starter plans (PPL, Upper/Lower, Full Body, 5×5, Greyskull LP), supersets/circuits, warmup/drop/rest-pause/timed/per-side sets, and 1-tap backup exercises.
   - **Smart Progression & Pocket Coach**: Linear, Greyskull LP (AMRAP), Double Progression, Triple Progression, automatic stall/deload detection, and BuiltWithScience+-style intra-workout RPE/RIR adjustments.
   - **Anatomical Muscle Map & Gradient Analytics**: 17-region SVG body map in 3 modes (Fractional Weekly Sets vs. MEV/MAV/MRV landmarks, Fatigue/Recovery decay, Untrained muscles), 1RM curves, Structural Balance ratios, and Year Activity Heatmap.
2. **Nutrition, Calories/Protein & Adaptive TDEE**:
   - **Calories & Protein First UI**: Dual progress rings, gram-weight scaling, Saved Meals ("Copy Yesterday", "Explode Meal"), and Quick Add.
   - **Barcode + Gemini 2.5 Flash-Lite AI**: Browser camera barcode scanner (Open Food Facts) + BYOK Gemini Flash-Lite for Photo-to-Meal estimation, Nutrition Facts Label OCR, and natural language food logging.
   - **MacroFactor-Inspired Physics Engine**: Exponentially smoothed **Trend Weight** alongside daily scale weight, **Dynamic Expenditure (TDEE)** calculation, **Partial-Day Logging Guardrail**, and **Weekly Strategy Check-Ins**.
3. **AI Coach, MCP & Plugin Ecosystem**:
   - Optional, off-by-default AI Coach that reads your plan, training logs, trend weight, and nutrition to propose routines or weekly adjustments via **Approve / Reject / 1-Click Undo Diff Cards**.
   - Local STDIO **MCP Server** (`packages/mcp`), Remote Cloudflare Worker **MCP Endpoint** (`/api/mcp`), and **OpenAPI Action Spec** for Claude, ChatGPT, and Gemini.
4. **Native iOS, Apple Watch & Fitness Wrapped**:
   - Native SwiftUI iOS & watchOS apps sharing the exact same SQLite schema via `SQLiteData` (`GRDB.swift`), HealthKit sync, Live Activities / Dynamic Island, Digital Crown set logging, and multi-stage rest timer haptics.
   - Cross-platform **Fitness Wrapped** interactive story summaries on Web and iOS.

---

## Tech Stack Summary ("SQLite-Everywhere")

- **Monorepo**: `pnpm` workspaces, TypeScript, `zod`, Oxc (`oxlint` + `oxfmt`), `vitest`
- **Web App (`apps/web`)**: React 19 SPA, Vite, TanStack Router, Tailwind CSS v4, Shadcn UI (`@base-ui/react`), Shadcn Charts (Recharts), Motion
- **Local Web DB**: `@sqlite.org/sqlite-wasm` (OPFS `sahpool` Web Worker) + Drizzle ORM
- **API & Cloud (`apps/api`)**: Cloudflare Workers + Hono RPC + Cloudflare D1 (SQLite) + Cloudflare R2 + Better Auth
- **iOS & watchOS (`ios/`)**: Swift, SwiftUI, `SQLiteData` (`GRDB.swift`), HealthKit, WatchConnectivity, ActivityKit, WidgetKit
- **CI/CD**: GitHub Actions + Wrangler

---

## Documentation Index (`docs/`)

- **[Agent Implementation Plans (`docs/plans/v0.1` – `v1.5`)](file:///Users/shouryan/Programming/gains/docs/plans/README.md)** — Standalone, step-by-step plans you can hand directly to an agent (`"Implement docs/plans/v0.1-foundation-and-local-sqlite.md"`)
- [01 — Architecture & Tech Stack](file:///Users/shouryan/Programming/gains/docs/01-architecture-and-tech-stack.md)
- [02 — Database Schema & Offline Sync Spec](file:///Users/shouryan/Programming/gains/docs/02-database-and-sync-spec.md)
- [03 — Gym Tracking, Progression & Analytics Spec](file:///Users/shouryan/Programming/gains/docs/03-gym-and-progression-spec.md)
- [04 — Nutrition, Trend Weight & Adaptive TDEE Spec](file:///Users/shouryan/Programming/gains/docs/04-nutrition-and-tdee-spec.md)
- [05 — AI Coach, MCP Server & Plugins Spec](file:///Users/shouryan/Programming/gains/docs/05-ai-coach-and-mcp-spec.md)
- [06 — Native iOS, Apple Watch & Fitness Wrapped Spec](file:///Users/shouryan/Programming/gains/docs/06-ios-watch-and-wrapped-spec.md)
- [07 — Phased Release Roadmap (`v0.1` – `v1.5`)](file:///Users/shouryan/Programming/gains/docs/07-release-roadmap.md)
- [08 — Design Language](docs/08-design-language.md) — responsive layouts, two color presets, typography, charts, and workout interactions
- [Linear Tickets & Agent Import Prompt](file:///Users/shouryan/Programming/gains/docs/linear-tickets.md)
- [Exercise Catalog Documentation](file:///Users/shouryan/Programming/gains/catalog/README.md)

---

## Release Roadmap & Agent Implementation Plans

| Release | Implementation Plan | Focus | Priority |
| :--- | :--- | :--- | :--- |
| **`v0.1`** | [v0.1-foundation-and-local-sqlite.md](file:///Users/shouryan/Programming/gains/docs/plans/v0.1-foundation-and-local-sqlite.md) | Foundation, Monorepo, UI Shell & Local SQLite (Demo Mode) | P1 — Gym |
| **`v0.2`** | [v0.2-exercise-catalog.md](file:///Users/shouryan/Programming/gains/docs/plans/v0.2-exercise-catalog.md) | Exercise Catalog (5,632 Exercises FTS5) & Custom Exercises | P1 — Gym |
| **`v0.3`** | [v0.3-routine-builder-and-scheduling.md](file:///Users/shouryan/Programming/gains/docs/plans/v0.3-routine-builder-and-scheduling.md) | Routine Builder, Starter Plans & Scheduling | P1 — Gym |
| **`v0.4`** | [v0.4-active-workout-and-progression.md](file:///Users/shouryan/Programming/gains/docs/plans/v0.4-active-workout-and-progression.md) | Active Workout Player, Rest Timer, Pocket Coach & Progression Engine | P1 — Gym |
| **`v0.5`** | [v0.5-gym-analytics-and-body-map.md](file:///Users/shouryan/Programming/gains/docs/plans/v0.5-gym-analytics-and-body-map.md) | Gym Analytics, 3-Mode Muscle Body Map, 1RM & Year Heatmap | P1 — Gym |
| **`v0.6`** | [v0.6-body-weight-and-csv-import.md](file:///Users/shouryan/Programming/gains/docs/plans/v0.6-body-weight-and-csv-import.md) | Body Weight (Trend Weight), Measurements & CSV Import/Export | P1 — Gym |
| **`v0.7`** | [v0.7-nutrition-core-and-tdee.md](file:///Users/shouryan/Programming/gains/docs/plans/v0.7-nutrition-core-and-tdee.md) | Nutrition Core, Barcode Scanner, Dynamic TDEE & Weekly Check-In | P2 — Nutrition |
| **`v0.8`** | [v0.8-nutrition-ai-vision-and-ocr.md](file:///Users/shouryan/Programming/gains/docs/plans/v0.8-nutrition-ai-vision-and-ocr.md) | Nutrition AI (Gemini Flash-Lite Photo, Label OCR & Text Logging) | P2 — Nutrition |
| **`v0.9`** | [v0.9-ai-coach-and-mcp.md](file:///Users/shouryan/Programming/gains/docs/plans/v0.9-ai-coach-and-mcp.md) | AI Coach (Proposal Diffs + Undo), MCP Server & OpenAPI Plugin | P2 — AI |
| **`v0.10`** | [v0.10-cloud-sync-auth-and-ci.md](file:///Users/shouryan/Programming/gains/docs/plans/v0.10-cloud-sync-auth-and-ci.md) | Cloudflare D1 Delta Sync, Better Auth (Passkeys) & GitHub Actions CI | P2 — Cloud |
| **`v1.0`** | [v1.0-ios-app-core.md](file:///Users/shouryan/Programming/gains/docs/plans/v1.0-ios-app-core.md) | Native iOS App Core (SwiftUI + `SQLiteData` / `GRDB.swift`) | P3 — Mobile |
| **`v1.1`** | [v1.1-ios-healthkit-live-activities-nutrition.md](file:///Users/shouryan/Programming/gains/docs/plans/v1.1-ios-healthkit-live-activities-nutrition.md) | iOS HealthKit, Lock Screen Live Activities, Widgets & Nutrition | P3 — Mobile |
| **`v1.2`** | [v1.2-apple-watch-companion.md](file:///Users/shouryan/Programming/gains/docs/plans/v1.2-apple-watch-companion.md) | Apple Watch Companion App (Digital Crown, Haptics, Live HR) | P3 — Mobile |
| **`v1.3`** | [v1.3-fitness-wrapped.md](file:///Users/shouryan/Programming/gains/docs/plans/v1.3-fitness-wrapped.md) | Fitness Wrapped (Ported to Web & iOS Story Experience) | P4 — Wrapped |
| **`v1.4`** | [v1.4-exercise-media-cdn.md](file:///Users/shouryan/Programming/gains/docs/plans/v1.4-exercise-media-cdn.md) | Exercise Media CDN (Cloudflare R2 Lazy WebP/MP4 Demos) | P5 — Polish |
| **`v1.5`** | [v1.5-progress-photos.md](file:///Users/shouryan/Programming/gains/docs/plans/v1.5-progress-photos.md) | Progress Photos & Timeline Scrubber (EXIF Strip + R2) | P6 — Backlog |
