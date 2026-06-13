# QuantumDesk Mini

A production-minded helpdesk slice for the Quantum Desk take-home: multi-tenant tickets, threaded conversations, real-time updates, audit trail, and optional AI assist.

Built with **Next.js 15**, **PostgreSQL**, **Prisma**, and **Server-Sent Events (SSE)**.

---

## Quick start

### Prerequisites

- Node.js 20+
- Docker Desktop (for PostgreSQL)

### Setup

```bash
git clone <your-repo-url>
cd quantumdesk-mini
cp .env.example .env          # edit locally — never commit .env
npm install
docker compose up -d          # Postgres on port 5433
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → login page.

> **Port note:** If `5432` is in use, this project uses **5433** (see `docker-compose.yml`).

### Demo accounts

Password for all seed users: **`demo123`** (override via `DEMO_PASSWORD` in `.env`).

| Role | Email | Name |
|------|-------|------|
| Agent | `alex.chen@quantumdesk.io` | Alex Chen |
| Agent | `priya.sharma@quantumdesk.io` | Priya Sharma |
| Customer | `sam.ortiz@acmecorp.com` | Sam Ortiz |
| Customer | `jordan.lee@acmecorp.com` | Jordan Lee |

Seed includes **8 tickets** (QD-1035–QD-1042) with realistic threads, assignments, and mixed statuses.

### Real-time demo

Open **two browser windows**:

1. Customer — `sam.ortiz@acmecorp.com`
2. Agent — `alex.chen@quantumdesk.io`

Reply on one side → the other updates **without refresh**.

---

## What was completed

| Category | Coverage |
|----------|----------|
| **Core requirements** | 100% — schema, migrations, indexes, REST API, customer portal, agent inbox, SSE real-time, Docker, seed |
| **Stretch goals** | 6/6 — assignment, filters/search, SLA badge, optimistic UI, auth, tests |
| **Extra credit** | Message pagination, audit trail, multi-tenant, targeted SSE payloads, DESIGN.md, optional AI |

See [DESIGN.md](./DESIGN.md) for scaling architecture and tradeoffs.

---

## API reference

All endpoints require a valid session cookie (`qd_session`) unless noted. Unauthenticated requests return **401**.

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/login` | Email + password login | Public |
| `POST` | `/api/auth/logout` | Clear session | Session |
| `GET` | `/api/auth/me` | Current user profile | Session |

**Login body:**
```json
{ "email": "alex.chen@quantumdesk.io", "password": "demo123" }
```

### Tickets

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| `GET` | `/api/tickets` | List tickets | Customer: own tickets · Agent: all org tickets |
| `POST` | `/api/tickets` | Create ticket | Customer only |
| `GET` | `/api/tickets/:id` | Ticket detail + paginated messages | Customer: own · Agent: org |
| `POST` | `/api/tickets/:id/messages` | Post message | Customer: own · Agent: org |
| `PATCH` | `/api/tickets/:id/status` | Update status (`OPEN` / `PENDING` / `RESOLVED`) | Agent only |
| `POST` | `/api/tickets/:id/assign` | Assign ticket to current agent | Agent only |
| `GET` | `/api/tickets/:id/events` | Audit trail | Customer: limited · Agent: full |
| `POST` | `/api/tickets/:id/ai` | AI summarize / suggest reply | Agent + customer (scoped actions) |

**List query params:** `status`, `priority`, `assigned` (`me` | `unassigned`), `q` (search titles + messages), `limit`

**Messages pagination:** `GET /api/tickets/:id?cursor=<messageId>&limit=20`

### Real-time & dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/events/stream` | SSE stream — org-scoped, ticket-filtered |
| `GET` | `/api/dashboard/stats` | Agent inbox KPIs |

**SSE events:** `message.created`, `ticket.updated`, `ticket.assigned` — small targeted payloads, not full threads.

### Validation & errors

- Request bodies validated with **Zod**
- Consistent error shape: `{ "error": "...", "details": [...] }`
- Status codes: `400` validation · `401` unauthenticated · `403` forbidden · `404` not found · `503` AI unavailable

---

## Real-time approach

**Technology:** Server-Sent Events via `/api/events/stream`

**Why SSE over WebSockets?**

- Ticket updates are predominantly **server → client** (new message, status change)
- Works over standard HTTP — no extra infra for a take-home
- Payloads are **targeted** (single message or metadata patch), not full thread broadcasts
- Subscribers filtered by `org_id`; customers only receive events for tickets they own

**Tradeoff:** SSE is one-way. For typing indicators or presence at scale, WebSockets or a managed service (Pusher/Ably) would be better. See [DESIGN.md](./DESIGN.md).

---

## Security

### Secrets & environment variables

| Variable | Scope | Committed? | Notes |
|----------|-------|------------|-------|
| `DATABASE_URL` | Server | ❌ `.env` only | Local Docker credentials in `.env.example` are demo-only |
| `OPENAI_API_KEY` | Server | ❌ Never | Optional AI — set locally in `.env` |
| `OPENAI_MODEL` | Server | ❌ Never | Defaults to `gpt-4o-mini` |
| `DEMO_PASSWORD` | Server | ✅ Example in `.env.example` | Demo auth only — replace in production |
| `NEXT_PUBLIC_APP_URL` | Client | ✅ Safe | Public app URL, no secrets |

**Rules enforced in this repo:**

1. `.env` is in `.gitignore` — real keys stay on your machine only
2. `.env.example` contains placeholders only — no real API keys
3. `OPENAI_API_KEY` is read **server-side only** (`src/lib/ai.ts`) — never sent to the browser
4. No `NEXT_PUBLIC_` prefix on secret keys

### Pre-push security check

Run before every commit/push:

```bash
npm run security:check
```

This script verifies:

- `.env` is not staged for git
- No OpenAI keys (`sk-...`) in tracked files
- No hardcoded secrets in source code

### Application security controls

| Control | Implementation |
|---------|----------------|
| **Authentication** | HttpOnly session cookie (`qd_session`), `secure` flag in production |
| **Authorization** | Role checks on every mutating endpoint (agent vs customer) |
| **Tenant isolation** | All queries scoped by `org_id` |
| **IDOR prevention** | Customers can only read/write their own tickets; SSE validates ticket ownership |
| **Input validation** | Zod schemas on all POST/PATCH bodies |
| **Middleware** | Unauthenticated API → 401; pages → redirect to `/login` |
| **AI gating** | Optional feature; returns 503 when key missing; demo fallback for submissions |

### What is intentionally demo-grade

This is a take-home slice, not production auth:

- Shared demo password for all seed users
- Session stored as user ID in cookie (no JWT/signing)
- No rate limiting or CSRF tokens

For production: NextAuth/Clerk, hashed passwords, signed sessions, Redis rate limits — documented in [DESIGN.md](./DESIGN.md).

---

## Optional AI features

AI is **optional extra credit** — the core app works without it.

```env
# In .env (local only — never commit)
AI_MODE=demo              # recommended for submission video (no billing needed)
# AI_MODE=auto            # try OpenAI, fall back to demo on quota errors
# AI_MODE=openai          # require live OpenAI

OPENAI_API_KEY=           # only if using live OpenAI
OPENAI_MODEL=gpt-4o-mini
```

| Action | Who | Description |
|--------|-----|-------------|
| `summarize` | Agent, Customer | Thread summary |
| `suggest-reply` | Agent only | Draft reply |
| `customer-insight` | Customer only | Plain-language status update |

Uses OpenAI Chat Completions via server-side `fetch` — no AI SDK dependency. Demo mode builds summaries locally when no key/billing is available.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed org, users, tickets |
| `npm test` | Run unit tests |
| `npm run security:check` | Scan for secrets before push |
| `npm run db:studio` | Prisma Studio |

---

## Tools, libraries & credits

| Tool | Purpose | Link |
|------|---------|------|
| [Next.js 15](https://nextjs.org/) | App Router, API routes, SSE | https://nextjs.org |
| [Prisma](https://www.prisma.io/) | ORM + migrations | https://www.prisma.io |
| [PostgreSQL 16](https://www.postgresql.org/) | Database (Docker) | https://www.postgresql.org |
| [Zod](https://zod.dev/) | Request validation | https://zod.dev |
| [Tailwind CSS 4](https://tailwindcss.com/) | Styling | https://tailwindcss.com |
| [Vitest](https://vitest.dev/) | Unit tests | https://vitest.dev |

Real-time: native **Server-Sent Events** — no Socket.IO, Pusher, or Ably.

AI-assisted development: Cursor for scaffolding and iteration. Architecture and security decisions reviewed manually.

---

## What I'd do next

1. **Production auth** — NextAuth/Clerk, bcrypt passwords, RBAC
2. **Integration tests** — Playwright for customer→agent real-time path
3. **Redis pub/sub** — fan-out SSE across multiple Next.js instances
4. **Rate limiting** — per-user message posting limits
5. **Email notifications** — webhook on new customer message when agent offline
6. **Full-text search** — Postgres `tsvector` for large message history

See [DESIGN.md](./DESIGN.md) for full scaling notes.

---

## Submission checklist

Before pushing to GitHub:

- [ ] Run `npm run security:check` — must pass
- [ ] Confirm `.env` is **not** in `git status`
- [ ] Rotate any API keys that were ever pasted into chat or committed by mistake
- [ ] Record ~5–8 min demo video (login → create ticket → live reply → filters/SLA)
- [ ] Push repo link + video to Quantum Desk

### Demo video script

1. Login as agent → inbox stats, SLA badges, filters
2. Open ticket → assign, change status, AI summarize
3. Second window: customer → create ticket, AI assistant
4. Customer sends message → agent sees it live
5. Mention: Prisma migrations, SSE, tenant isolation, audit trail, security check

---

## License

MIT — built as a take-home submission for Quantum Desk.
