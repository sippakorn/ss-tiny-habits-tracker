# ss-tiny-habits-tracker

**Tiny Habits Tracker** — a local-first **web app** for planning your week: set time
allocations and habit targets per activity, place them on a daily timeline, and track
goal-vs-actual. Built with **React + Vite + TypeScript + Tailwind CSS + shadcn/ui**, themed
with **UC Berkeley** colors (Berkeley Blue `#003262` and California Gold `#FDB515`).

All data stays in your browser (`localStorage`); there is no backend and no network calls.

## Run it (works directly from WSL)

Because this is now a plain web app, there are no native binaries — you can run it straight
from WSL (or anywhere) with Node 18+:

```bash
npm install
npm run dev
```

Then open the printed URL (default http://localhost:5173). Build a static bundle with:

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

Type-check with `npm run typecheck`.

## Features

- **Passcode lock** before the app. First run sets a passcode; it's hashed in-browser with
  **PBKDF2 (SHA-256, 150k iterations)** + a random salt via the Web Crypto API and stored in
  `localStorage`. Plaintext is never stored.
- **Dashboard** — KPI tiles, target-vs-planned progress bars (per the active week's goal),
  and an hours-per-day chart.
- **Weekly Goals** — set target hours per category for a specific week, plus an editable
  **Default weekly goals** section. Weeks without a custom goal fall back to the defaults.
- **Weekly Planner** — a 7-day × category matrix with per-day Workday/Weekend selectors and
  live totals.
- **Daily Schedule** — a 24-hour timeline with time blocks (e.g. Sleep 23:00–07:00 overnight,
  Work 08:00–17:00), a day picker, and a scheduled-vs-planned summary.
- **Day Templates** — default allocations for workdays and weekends that seed new weeks.
- **Categories** — add / edit / delete activities (color, description, weekly target).
- **System theme** — light/dark follows your OS automatically and live.

## Data & passcode

- **Stored in** your browser's `localStorage` under `tiny-habits:data` and `tiny-habits:auth`.
- **Reset / forgot passcode:** clear the site's storage in DevTools (Application →
  Local Storage), or remove just the `tiny-habits:auth` key to keep your plans.
- Data is per-browser/per-origin, so it won't sync across machines.

## Project structure

```
src/
├── index.css            # Tailwind + Berkeley shadcn theme tokens
├── main.tsx, App.tsx
├── lib/                 # types, defaults, dates, time, calc, utils, store (localStorage + Web Crypto)
├── hooks/               # useSystemTheme, useAppData
└── components/
    ├── ui/              # shadcn primitives (button, card, input, label, badge, select)
    └── *.tsx            # LockScreen, Sidebar, Dashboard, WeeklyGoals, Planner, Daily, Templates, Categories
```

## Notes

- UI primitives follow the shadcn/ui pattern (Tailwind + CVA + Radix for Select). Add more
  components with the shadcn CLI thanks to `components.json`.
- Theme colors are defined as HSL CSS variables in `src/index.css`; tweak there to adjust the
  palette.
```
