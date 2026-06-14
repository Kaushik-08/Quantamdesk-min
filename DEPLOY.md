# Deploy QuantumDesk

Live demo for interviewers: **Next.js + PostgreSQL + SSE real-time**.

## Recommended: [Render](https://render.com) (free)

Best fit for this project because real-time uses **in-memory SSE** — it needs one always-on Node process. Render’s free web service provides that. Serverless hosts (Vercel) can break live updates between agent and customer windows.

| Tier | Cost | Caveat |
|------|------|--------|
| Render Web + Postgres | **$0** | Service sleeps after ~15 min idle; first visit takes ~30–60s to wake |
| Neon + Vercel | **$0** | Easier Next.js deploy; real-time may be unreliable (see below) |

---

## Option A — Render (recommended)

### 1. Push latest code to GitHub

```bash
cd /Users/kmurugan/Downloads/quantumdesk-mini
git add -A
git commit -m "Add deployment guide and production scripts"
git push --no-verify
```

Repo: [https://github.com/Kaushik-08/Quantamdesk-min](https://github.com/Kaushik-08/Quantamdesk-min)

### 2. Create PostgreSQL on Render

1. Go to [render.com](https://render.com) → sign up (GitHub login).
2. **New +** → **PostgreSQL**.
3. Name: `quantumdesk-db`, region: closest to you, plan: **Free**.
4. Create → copy the **Internal Database URL** (starts with `postgresql://`).

### 3. Create Web Service

1. **New +** → **Web Service**.
2. Connect repo `Kaushik-08/Quantamdesk-min`.
3. Settings:

| Field | Value |
|-------|--------|
| Name | `quantumdesk-mini` |
| Region | Same as database |
| Branch | `main` |
| Runtime | **Node** |
| Build Command | `npm install && npx prisma migrate deploy && npm run db:seed && npm run build` |
| Start Command | `npm start` |
| Plan | **Free** |

### 4. Environment variables

In the web service → **Environment**:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Paste **Internal** Postgres URL from step 2 |
| `DEMO_PASSWORD` | Choose a demo password (e.g. for reviewers — **do not commit**) |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-SERVICE.onrender.com` (update after first deploy) |
| `NODE_VERSION` | `20` |
| `AI_MODE` | `demo` (optional — no OpenAI billing needed) |

Click **Save Changes** → **Manual Deploy**.

### 5. After deploy

1. Open `https://YOUR-SERVICE.onrender.com`
2. Click **Alex Chen** under “Try the demo” (or sign in with seed email + `DEMO_PASSWORD`)
3. Add the live URL to your submission email to Quantum Desk

**Share with interviewers:**

- **Live URL:** `https://YOUR-SERVICE.onrender.com`
- **Demo password:** send privately in your submission email (not in public README)

---

## Option B — Vercel + Neon (alternative)

Good if Render is slow or unavailable. **Real-time may not work reliably** on serverless.

### 1. Database — [Neon](https://neon.tech)

1. Create free project → copy connection string.
2. Append `?sslmode=require` if not present.

### 2. App — [Vercel](https://vercel.com)

1. Import GitHub repo `Quantamdesk-min`.
2. Framework: Next.js (auto-detected).
3. Environment variables:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Neon connection string |
| `DEMO_PASSWORD` | Your chosen demo password |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-APP.vercel.app` |
| `AI_MODE` | `demo` |

4. **Deploy**.

### 3. Run migrations (once)

From your machine:

```bash
DATABASE_URL="your-neon-url" npx prisma migrate deploy
DATABASE_URL="your-neon-url" npm run db:seed
```
