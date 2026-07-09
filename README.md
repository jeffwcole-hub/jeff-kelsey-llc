# Kelsey & Jeff LLC ✨

A very serious company. One Netlify site, two divisions:

- **/** — How Long Are We Apart? (Department of Weights and Measures)
- **/points/** — Ten Points (Department of the Treasury)
- **/pips/** — PIPs (Department of Human Resources): each partner's
  Performance Improvement Plan, administered exclusively by the other.
  Items marked improved are archived as growth history.
- **/list/** — 💩 List (Department of Public Health): a shared grievance
  record. Anyone can file; only the aggrieved party may settle.

A shared frosted-glass hamburger drawer navigates between them.

## Deploy (pick one)

### Option A — GitHub repo (recommended)
1. Push this folder to a GitHub repo
2. Netlify: **Add new site → Import an existing project** → pick the repo
3. `netlify.toml` handles the rest

### Option B — Netlify CLI
```bash
npm install
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

> Drag-and-drop deploys won't work: the points function needs its
> `@netlify/blobs` dependency bundled (git build or CLI does this).

## Push notifications (one-time setup)

All three apps send push notifications (PIP items, point awards,
grievances) to the other person's devices. To activate:

1. In Netlify: **Site configuration → Environment variables**, add:
   - `VAPID_PUBLIC_KEY` — from your key pair
   - `VAPID_PRIVATE_KEY` — from your key pair
   - `VAPID_SUBJECT` — `mailto:you@example.com` (any real-ish mailto)
2. Redeploy the site
3. On each phone: install the site to the home screen (required by
   iOS for web push), open it, then in the hamburger drawer tap
   **🔔 Enable notifications** and allow.

Notifications only go to the *other* person — you never get pinged
for your own filings.

## Before first deploy

Copy your existing PWA icons into the repo root:
- `icon-512.png`
- `apple-touch-icon.png`

(`manifest.webmanifest` and `sw.js` are included and cover both pages;
the old Apart-only versions are superseded.)

## Architecture

- `index.html` — Apart. Client-only converter, no backend.
- `points/index.html` — Ten Points. Polls `/api/points` every 5s; instant
  refresh after posting. Runs in localStorage demo mode if the API is
  unreachable (e.g. opened as a local file).
- `netlify/functions/points.mjs` — the API, backed by Netlify Blobs
  (store `ten-points`, key `entries`). Append-only ledger. Validates:
  two named players only, no self-dealing, whole amounts ±999, reason
  required.
- `sw.js` — network-first caching of both app shells for offline use;
  never caches `/api/*`.

## House rules, as implemented

- Points may only be bestowed upon the other party
- Fast path: one tap for the classic +10
- Off-menu: +5 (petty), −10 (penalty), +25 (big deal), +50 (legendary),
  or name your price (±999)
- Ceremonies escalate with magnitude; negatives get the coral treatment
- Every entry needs a reason. The reason is the whole point.
- The Apart exchange rate is fixed at 1:50 and is non-negotiable
