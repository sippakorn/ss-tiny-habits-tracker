# Deployment Model — options & decisions

Working notes on hosting **Tiny Habits Tracker** (a static React/Vite SPA, local-first via
`localStorage`). **Status: decision parked.** Prices are approximate and region/time-dependent
— verify on the Azure Pricing Calculator.

## Requirements driving the choice

- **User login** and a **guarded zone** (app not publicly visible without auth).
- **Minimum cost** (personal tool, low traffic).
- May host **~3 apps** total over time.
- Optional later: **per-user data sync** across devices (replacing per-browser localStorage).

## Options at a glance

| Option | Model | Cost (ballpark) | Login/guard | Notes |
|---|---|---|---|---|
| **Static Web Apps – Free** | Static hosting + CDN | **$0** | ❌ real login needs Standard | Great for static only |
| **Static Web Apps – Standard** | Static + managed Functions/auth | **~$9/mo per app** | ✅ custom auth | Per-app cost adds up for 3 apps |
| **Blob static website** | Object storage | **~$0** (blob URL) | ❌ | Custom-domain HTTPS needs CDN/Front Door ($$) |
| **App Service – Basic (B1)** | Reserved compute (flat) | **~$13/mo total** | ✅ Easy Auth (free) | One plan hosts all 3 apps; no cold start |
| **Azure Container Apps** | Consumption, pay-per-use | **~$0 idle → usage** | ✅ built-in auth | Scale-to-zero; cold starts; containers |

## Pricing models: App Service vs ACA

- **App Service = reserve-and-pay-flat.** Rent an App Service Plan billed per hour it exists,
  regardless of traffic. **Multiple apps share one plan at no extra compute cost.** Predictable,
  always-on, no cold starts. B1 ≈ $13/mo, S1 ≈ $70/mo, P1v3 ≈ $120+/mo.
- **ACA (Consumption) = pay-per-use with scale-to-zero.** Billed on **vCPU-seconds + GiB-seconds
  + requests**. Idle (0 replicas) = **$0**. Free monthly grant per subscription: ~**180,000
  vCPU-s + 360,000 GiB-s + 2M requests** (shared across all ACA apps in the subscription).
  Variable cost, cold starts when scaled to zero.

### When each wins
- **Several small, always-on, steady-traffic apps that need auth** → **App Service B1** (~$13/mo
  flat for all 3, free Easy Auth, no cold starts). Cheaper per app than SWA Standard (~$9 each).
- **Mostly-idle / bursty / containerized apps** → **ACA** scale-to-zero (~$0 idle, pay only on use).
- **Mixed** → static apps on SWA/Storage; dynamic ones on ACA; or consolidate steady apps on one
  App Service plan.

## Cold start & idle timing

| Config | Idle → scales down | Cold start | Idle cost |
|---|---|---|---|
| **ACA, minReplicas=0** | ~5 min cooldown (default) | ~2–10 s on next request | **$0** |
| **ACA, minReplicas≥1** | never | none | pays continuously (idle rate) |
| **App Service B1 + Always On** | never | none | flat ~$13/mo |
| **App Service, no Always On / Free** | ~20 min | few seconds | flat (still paying) |

- ACA scale-down is governed by KEDA (`cooldownPeriod` default ~300 s, `pollingInterval` ~30 s).
- Cold start depends on image size + app startup; lean Node/nginx ≈ low single-digit seconds.

## ACA cost for an intermittent-use pattern

Example idle windows (app NOT used): 00–06, 10–12, 14–17 = **11 h/day idle**. ACA bills **actual
replica runtime**, not wall-clock "used" hours, so idle windows are automatically **$0**.

- **Worst case** (a replica pinned up the whole ~13 used hours/day, 30 days = 1,404,000 active-s):
  - 0.25 vCPU / 0.5 GiB ≈ **~$5/mo** · 0.5 vCPU / 1 GiB ≈ **~$16/mo**.
- **Realistic bursty** (replica actually runs ~2 h/day): consumption stays **within the free
  grant → ~$0**.

### Does the ~5-min cooldown count?
**Yes.** During cooldown the replica is still running, so it accrues vCPU/GiB-seconds (billed at
the cheaper **idle rate**, not free). So it counts toward any self-imposed "running-time" budget:
- Default 5-min cooldown → ~**24 syncs/month ≈ 2 h** of running time.
- Lower `cooldownPeriod` to ~**60 s** → ~**120 syncs/month** before hitting 2 h.
- In dollars it's negligible (idle rate + free grant ≈ $0); the cooldown matters mainly for the
  running-time metric, not the bill.

## Recommended pattern to minimize cost: local-first + manual sync

The app already uses `localStorage`. Keep it as the source of truth and **sync only on demand**,
so the backend (ACA) is touched in brief bursts and stays scaled to zero otherwise.

```
Normal use:  app ⇄ localStorage         (offline, instant, backend untouched → $0)
Click Sync:  app ──HTTPS──► backend wakes (~2–10s) ──► JSON in Table/Blob ──► scales to zero
```

- Use **`minReplicas = 0`** and a short **`cooldownPeriod` (~60 s)** to keep running time tiny.
- Even ~3 syncs/day stays inside the free grant → **effectively $0**.
- This client sync layer is **host-independent** — building it doesn't lock in ACA vs App Service.

### Per-user sync data design (single user, simplest correct)
- Store the whole `AppData` as **one JSON document per user** (Azure **Table** or **Blob**).
- Add `meta.updatedAt` (+ `deviceId`); bump on every local save.
- Endpoints: `GET /api/data` (pull) / `PUT /api/data` (push), or `POST /api/sync` with
  **last-write-wins by `updatedAt`** (prompt if remote is newer).
- Identity from the platform auth header (App Service Easy Auth or ACA built-in auth) scopes the
  document to the user. Field-level merge only needed for true concurrent multi-device editing.

## Decision criteria (to resolve later)

- Want **flat, predictable cost + no cold starts + several apps** → **App Service B1** (~$13/mo all-in).
- Want **pay-only-for-use, OK with cold starts, mostly idle** → **ACA** (Consumption, `minReplicas=0`).
- Want **$0 and no real login** → **SWA Free** or **Blob** (static only).
- Auth: App Service & ACA include built-in auth (free); SWA needs Standard (~$9/mo) for real login.

## Notes / caveats

- **Log Analytics** ingestion is billed separately on ACA (Azure Monitor ~5 GB/mo free; personal
  app ≈ $0).
- ACA free grant is **per-subscription, shared** across apps — 3 apps consume it faster.
- Non-Azure free static hosts (Cloudflare Pages, GitHub Pages, Netlify, Vercel) can host this SPA
  at $0 with free custom-domain HTTPS — flagged for completeness; out of scope if staying on Azure.
