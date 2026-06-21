# AGENTS.md — Tiny Habits Tracker

Context for AI agents working in this repo. Keep this file updated as the app evolves.

## What this is

A **local-first personal planner** web app: plan your week, schedule your day on a
timeline, track tiny habits with a GitHub-style heatmap, and run side projects with
milestones — all stored in the browser. UI is themed after **UC Berkeley** (Berkeley Blue
`#003262`, California Gold `#FDB515`).

> History: started as an Electron desktop app, then migrated to a plain web app (Vite) so it
> runs anywhere (including directly from WSL). There is **no Electron code anymore**.

## Tech stack

- **React 18 + TypeScript + Vite** (SPA, no router — navigation is in-memory via a `View` union).
- **Tailwind CSS + shadcn/ui** (primitives in `src/components/ui`, `cn()` from `src/lib/utils`).
- **lucide-react** icons. **react-markdown + remark-gfm** for to-do detail rendering.
- Persistence: **`localStorage`** (no backend). Passcode gate hashed with **Web Crypto PBKDF2**.
- Path alias: `@/` → `src/`.

## Run / build (from WSL or anywhere with Node 18+)

```bash
npm install
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # outputs dist/
npm run typecheck  # tsc --noEmit
```

There is no working shell in the agent sandbox during development; verify type/build by
running these yourself.

## Project structure

```
src/
├── main.tsx, App.tsx, index.css      # entry, shell+routing, Tailwind+Berkeley theme tokens
├── lib/
│   ├── types.ts        # all domain types + AppData + View union
│   ├── defaults.ts     # DEFAULT_DATA, seeded categories, day-block templates
│   ├── store.ts        # localStorage load/save + Web Crypto passcode
│   ├── dates.ts        # startOfWeek, isoDate, addDays, shiftISODay, formatWeekRange, formatDayLabel
│   ├── time.ts         # minutesToTime / timeToMinutes
│   ├── calc.ts         # week creation, totals, blockDurationHours, weekGoal
│   ├── todos.ts        # todo CRUD helpers + filters
│   ├── projects.ts     # project/milestone CRUD + progress
│   ├── habits.ts       # habit CRUD, intensity, heatmap helpers, streak, applyHabitRules
│   └── utils.ts        # cn()
├── hooks/
│   ├── useTheme.ts     # useSystemTheme() toggles `dark` class from OS preference
│   └── useAppData.ts   # { data, update } — the single state+persistence entry point
└── components/
    ├── ui/             # shadcn: button, card, input, label, badge, select
    ├── Sidebar.tsx, LockScreen.tsx
    ├── Dashboard.tsx, WeeklyGoals.tsx, Planner.tsx, Daily.tsx
    ├── Habits.tsx, HabitControls.tsx (HabitHeatmap, HabitTodayItem)
    ├── Projects.tsx, Settings.tsx
    ├── Categories.tsx, Templates.tsx        # master data, rendered inside Settings
    └── TodoItem.tsx, TodoModal.tsx          # shared to-do row + markdown/tags modal
```

## Data model (see `src/lib/types.ts`)

`AppData = { categories, templates, weeks, todos, projects, habits }`, persisted at
`localStorage["tiny-habits:data"]`; auth credential at `tiny-habits:auth`.

- **Category**: `{ id, name, color, description, weeklyTarget }` (master data).
- **WeekPlan** (`weeks[isoMonday]`): 7 `DayPlan`s (`allocations` per category, optional
  `blocks: TimeBlock[]`) + optional per-week `goals` (override category weeklyTarget).
- **TimeBlock**: `{ id, categoryId, start, end }` in minutes from midnight; `end <= start`
  means it crosses midnight (overnight).
- **Todo**: `{ id, text, done, date|null, categoryId|null, details?, tags?, projectId?, milestoneId? }`.
  `date===null` = backlog. Reused everywhere (Daily, Dashboard, Projects).
- **Project**: `{ id, name, description?, color, milestones: Milestone[] }`;
  **Milestone**: `{ id, title, dueDate|null }`.
- **Habit**: `{ id, name, type:'check'|'scale', color, entries: Record<isoDay, number>,
  autoRule?: { kind:'category'|'project', id } }`. check entries=1; scale=1..5.

## Features by menu (`View` union drives `Sidebar` + `App` routing)

- **Dashboard**: "Today's focus" (today's blocks + today's to-dos), "Habits today" (partial),
  Targets-vs-Planned bars (uses week-specific goal), hours-per-day chart.
- **Weekly Goals**: per-week target overrides + editable default targets.
- **Weekly Planner**: 7×category hours matrix, workday/weekend per-day toggle, totals.
- **Daily Schedule**: 24h timeline with **drag-to-resize** blocks (15-min snap, overnight
  aware) and **click-to-edit** modal (shows duration in hours); per-day to-dos + Backlog.
- **Habits**: add check/scale habits; per-habit **contribution heatmap** (click cells to log);
  streak; **auto-rules** — link a habit to a category/project so it auto-completes weighted by
  the share of that day's matching to-dos completed (scale=1..5; checkbox=all-done).
- **Projects**: projects → milestones (with due dates + overdue flag) → to-dos; overall and
  per-milestone progress bars.
- **Settings**: master data (Categories, Day Templates) under an extensible sub-tab bar.

## Conventions

- **State changes go through `update((prev) => next)`** from `useAppData` (immutable updates;
  it persists to localStorage). Never mutate `data` directly.
- Domain mutations are **pure helpers in `src/lib/*`** that take and return `AppData`.
- Components: functional, named exports (except `App` default), return type `JSX.Element`,
  styled with Tailwind + `cn()`. Reuse `src/components/ui` primitives.
- IDs: `Math.random().toString(36).slice(2, 9)`.
- `applyHabitRules(data)` runs in an `App` effect on every data change and is **loop-safe**
  (returns the same reference when nothing changes) — keep it idempotent.
- Theme: light/dark follows the OS via the `dark` class; colors are HSL CSS vars in
  `src/index.css`. Content area is full-width.

## Adding a new menu/page

1. Add the id to the `View` union in `src/lib/types.ts`.
2. Add an item (id, label, lucide icon) to `ITEMS` in `src/components/Sidebar.tsx`.
3. Create the component and route it in `src/App.tsx` (`{view === 'x' && <X .../>}`).
4. New master-data screens go as a section inside `Settings.tsx` (add to its `SECTIONS`).

## Known constraints / notes

- Data is **per-browser** (`localStorage`) — no sync across devices, no real backend.
- The **passcode is a local gate, not real security** (anyone can load the app; data is local).
- Migration-safe: `store.ts` merges `DEFAULT_DATA`, so new top-level keys default in for old
  saved data. When adding a new `AppData` field, also add it to `DEFAULT_DATA`.

## Parked decision: hosting

Deferred. The app is a static SPA today. Options discussed (revisit later):
- **Azure Static Web Apps** — Free tier $0 (static only); real login/guard needs Standard (~$9/mo).
- **Azure App Service Basic (B1 ~$13/mo)** — one plan hosts multiple apps; free Easy Auth
  (login + "require authentication" guard); no cold starts. Preferred for several small
  always-on apps.
- **Azure Container Apps** — pay-per-use, scale-to-zero (~$0 idle, ~2–10s cold start, ~5 min
  to idle); good for bursty/containerized workloads.
- To add real auth + per-user sync later: swap `store.ts` to call a small API
  (Functions/Express) reading the platform identity header, backed by Table Storage/Cosmos.
