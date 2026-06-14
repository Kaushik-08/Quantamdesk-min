# QuantumDesk Mini — Design Notes

## Overview

QuantumDesk Mini models a multi-tenant helpdesk: organizations contain users (customers and agents), tickets, threaded messages, and an audit log. The current implementation optimizes for clarity, correctness, and a credible path to production scale.

## Data model

```
Organization (org_id)
 ├── Users (CUSTOMER | AGENT)
 ├── Tickets (status, assignment, timestamps)
 │    ├── Messages (author, body, created_at)
 │    └── TicketEvents (audit: status, assignment, messages)
```

**Multi-tenant isolation:** Every ticket query includes `orgId` from the authenticated session. This prevents cross-tenant data leaks even with simple auth.

**Indexes:**

| Index | Rationale |
|-------|-----------|
| `messages(ticket_id, created_at)` | Thread fetch + cursor pagination |
| `tickets(org_id, status, updated_at DESC)` | Agent inbox with status filter |
| `tickets(created_by, updated_at DESC)` | Customer “my tickets” |
| `tickets(assigned_to)` | “Assigned to me” filter |
| `ticket_events(ticket_id, created_at DESC)` | Audit trail |

## API design

- **Validation at the edge** — Zod schemas return `400` with structured errors.
- **Authorization in handlers** — customers scoped to `createdBy`; agents get org-wide access.
- **Transactions** — message post + ticket `updated_at` bump + audit event in one transaction.
- **Pagination** — cursor-based on `messages.id` (stable, index-friendly).

### Avoiding N+1

The agent inbox SLA badge (“minutes since last customer message”) uses a single `DISTINCT ON` query across all visible ticket IDs instead of per-ticket lookups.

## Real-time architecture

```
[Client] --EventSource--> [/api/events/stream]
                              |
                    in-memory subscriber map
                              ^
[API handlers] --publish()----+
```

**Event types (minimal payloads):**

- `message.created` — one serialized message
- `ticket.updated` — status, assignee, `updatedAt` only
- `ticket.assigned` — same shape as ticket.updated

**Filtering:** Subscribers register with `orgId` and either `ticketIds: Set` or `"all"` (agents). Events never include full threads.

### Scaling real-time beyond one server

| Approach | Pros | Cons |
|----------|------|------|
| **SSE + in-memory (current)** | Zero deps, fast to ship | Single instance only |
| **SSE + Redis Pub/Sub** | Multi-instance fan-out | Redis ops, reconnect handling |
| **WebSockets (Socket.IO)** | Bidirectional, rooms | Sticky sessions, more complex |
| **Managed (Pusher/Ably/Supabase)** | Reliable at scale | Cost, vendor lock-in |

**Recommendation for 10–100 agents:** Redis Pub/Sub with SSE edge nodes. Each Next.js instance subscribes to `org:{id}` channels and forwards to local SSE connections.

**Recommendation for 1000+ agents:** Dedicated realtime service + message queue (Kafka/NATS) for ticket events; clients subscribe per ticket or per agent inbox partition.

## Scaling reads

### Agent inbox (hot path)

Current: `ORDER BY updated_at DESC LIMIT 50` with optional filters.

At scale:

1. **Materialized inbox view** — denormalize `last_message_at`, `last_customer_message_at`, `assignee_name` on `tickets` to avoid joins.
2. **Keyset pagination** — `WHERE updated_at < :cursor` instead of offset.
3. **Read replicas** — route list endpoints to replicas; writes to primary.

### Message threads (long conversations)

Current: cursor pagination, 30 messages per page.

At scale:

1. **Archive old messages** to cold storage after N months.
2. **Virtualized UI** — render only visible rows (react-window).
3. **Separate `message_bodies` table** if bodies grow large (metadata vs body split).

## Scaling writes

- **Connection pooling** — PgBouncer in transaction mode.
- **Idempotent message POST** — client sends `Idempotency-Key` header to dedupe optimistic retries.
- **Async audit** — enqueue `ticket_events` to a worker if write latency matters (trade: eventual consistency on audit UI).

## Auth evolution

Current: HTTP-only cookie `qd_user_id` + user switcher (acceptable per spec).

Production path:

1. OAuth (Google/Microsoft) or magic link
2. JWT/session with `orgId`, `role`, `userId` claims
3. Row-level security in Postgres (`org_id = current_setting('app.org_id')`)

## Observability

- Structured logs on API errors with `ticketId`, `userId`, `orgId`
- Metrics: `messages_posted_total`, `sse_connections_active`, `inbox_query_duration_ms`
- Tracing: OpenTelemetry on Prisma queries and SSE publish path

## Security considerations

- Rate limit message POST (e.g. 30/min per user)
- Sanitize message body (XSS on render — React escapes by default)
- CSRF: same-site cookies + POST from same origin
- Never expose `org_id` in client-controlled query params

## What I’d prioritize next

1. Redis-backed SSE for horizontal scale
2. Playwright E2E: customer posts → agent receives < 2s
3. Proper auth + RBAC middleware
4. Denormalized inbox columns for SLA without extra queries
5. Webhook integrations (Slack notify on unassigned OPEN tickets)

