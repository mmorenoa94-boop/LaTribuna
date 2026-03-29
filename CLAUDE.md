# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**La Tribuna** is a PWA for real-time sports trivia gamification targeting Colombian football fans. Two user types:
- **Hinchas** (fans): join leagues, answer live questions, earn XP/points, redeem rewards
- **Negocios** (businesses): manage leagues, create questions, send promotions, run venue battles

## Commands

### Main App
```bash
pnpm dev          # Next.js dev server (port 3000)
pnpm build        # Generates Prisma client + Next.js build
pnpm lint         # ESLint
pnpm db:push      # Apply schema changes without migration
pnpm db:migrate   # Create and apply new migration
pnpm db:generate  # Regenerate Prisma client
pnpm db:studio    # Prisma Studio GUI
```

### Socket Server (separate process, port 4000)
```bash
cd socket-server && pnpm dev    # tsx watch mode
cd socket-server && pnpm build  # Compile TS
```

There are no automated tests in this codebase.

## Architecture

### Two-Service Setup
- **Next.js app** (Vercel, port 3000): API routes + SSR frontend
- **Socket server** (`socket-server/index.ts`, Railway, port 4000): handles real-time events via Socket.io

Real-time flow: Next.js API routes push events to a Redis list (`lt:socket:events`) via `lib/socket-emit.ts`. The socket server polls this list every 500ms (Upstash REST limitation) and broadcasts to connected clients.

### Route Groups
- `app/(auth)/` — Login, onboarding, registration (hincha & negocio)
- `app/(hincha)/` — Fan interface: home, leagues, trivia, wallet, profile, explore, notifications
- `app/(negocio)/dashboard/` — Business dashboard: leagues CRUD, promotions, config
- `app/api/` — ~22 REST endpoint groups
- `app/invite/[code]/` — Public league invite links

### Auth & Authorization
NextAuth v5 with JWT strategy (`lib/auth.ts`). Three providers: Google, Apple, Credentials (bcryptjs). Use `requireAuth(role?)` from `lib/auth-guard.ts` at the top of API routes — returns `NextResponse` 401/403 or the session.

Session extends with: `id`, `role` (UserRole), `level`, `xp`.

### Data Layer
Prisma + Neon (PostgreSQL). Singleton client in `lib/prisma.ts`. Key models:
- `User` → `Wallet` (1:1), `LeagueMember` (many), `Checkin` (many)
- `League` → `LeagueMember`, `LeagueMatch`, `LeagueQuestion`, `LeaguePrize`
- `LeagueQuestion` → `Answer` (live) / `Prediction` (pre-match) — resolved separately
- `Business` → `League` (many), `Checkin`, `Promotion`, `Reward`

### Caching (Redis via Upstash)
`lib/redis.ts` exposes `cacheGet/cacheSet/cacheDel` with `CACHE_KEYS` constants for: live matches, leaderboard, user balance, venue check-ins, public leagues.

### Gamification Logic (`lib/scoring.ts`)
- 20 levels with cumulative XP thresholds
- `scoreQuestionAnswers()` — awards wallet points + league `totalPoints` + 5 XP; applies a presential multiplier if the user has an active check-in at the league's business
- `scorePredictions()` — resolves pre-match predictions; exact score gets 2× bonus

### State Management
Zustand stores in `stores/`:
- `authStore` — current user (mirrors NextAuth session)
- `triviaStore` — active question, selected answer, timer, last result
- `notificationStore` — toast queue with auto-dismiss

### Validation
All API input validated with Zod schemas from `lib/validations.ts`. Types in `types/index.ts` re-export Prisma types and add extended UI types (`LeagueWithDetails`, `LeaderboardEntry`, `LiveQuestion`, `ApiResponse<T>`, etc.).

### Styling
Tailwind with a dark design system. Custom color tokens all prefixed `lt-` (e.g., `lt-black`, `lt-green`, `lt-card`). Fonts: Bebas Neue (headings), Barlow (body), Barlow Condensed (buttons). Animations: `slide-up`, `fade-in`, `pulse-dot`, `ticker`, `xp-fill`.

## Key External Services
| Service | Purpose | Env Prefix |
|---------|---------|------------|
| Neon | PostgreSQL | `DATABASE_URL`, `DIRECT_URL` |
| Upstash | Redis cache + socket queue | `UPSTASH_REDIS_*` |
| API-Football | Match data sync | `API_FOOTBALL_KEY` |
| Cloudinary | Image uploads | `CLOUDINARY_*` |
| Wompi | Colombian payments | `WOMPI_*` |
| Web Push (VAPID) | Push notifications | `VAPID_*` |

## Database: Dual Environment Setup

There are **two separate Neon databases** — changes to `prisma/schema.prisma` must be applied to both:

| Environment | Host | Used by |
|-------------|------|---------|
| Development | `ep-rapid-breeze-am0sqedm` | Local dev (`pnpm dev`) |
| Production  | `ep-rapid-salad-a472hpu0` | Vercel deployment |

The `.env` file points to **development** by default. Vercel has its own env vars pointing to production.

### When you modify `prisma/schema.prisma`:
1. **Dev**: `pnpm db:push` (uses `.env` as-is)
2. **Prod**: Temporarily swap the `DATABASE_URL`/`DIRECT_URL` in `.env` to the production values, run `pnpm db:push`, then revert `.env` back to development
3. **Always do both** before merging to `main` — Vercel runs `prisma generate` on deploy but does NOT run `db:push`, so the production DB must already have the new columns

**Failure to push to prod will crash the entire app** with `PrismaClientKnownRequestError: column does not exist`.

## Git Workflow
- **Always `git pull` before pushing** to any branch
- **Always create a new feature branch** from `develop` for each task
- Merge into `develop` first, verify, then create a PR to `main`

## Important Notes
- Cron jobs are defined in `app/api/cron/` but **not registered in `vercel.json`** (Hobby plan limit) — must be triggered manually or externally
- PWA service worker is disabled in dev (`next.config.js`)
- `@/*` path alias maps to the repo root
- Socket server has its own `tsconfig.json` and is excluded from the main TS project
