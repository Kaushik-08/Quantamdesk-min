import { NextRequest, NextResponse } from "next/server";
import { TicketEventType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getNextTicketNumber,
  isErrorResponse,
  jsonError,
  minutesSince,
  requireUser,
  serializeTicket,
  ticketSelect,
} from "@/lib/api-helpers";
import { createTicketSchema, listTicketsQuerySchema, validationError } from "@/lib/validation";
import { publishToOrg } from "@/lib/realtime";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = listTicketsQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error), { status: 400 });
  }

  const { status, priority, assigned, sla, q, limit } = parsed.data;

  const where: Record<string, unknown> = { orgId: user.orgId };

  if (user.role === UserRole.CUSTOMER) {
    where.createdBy = user.id;
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;

  if (user.role === UserRole.AGENT && assigned === "me") {
    where.assignedTo = user.id;
  } else if (user.role === UserRole.AGENT && assigned === "unassigned") {
    where.assignedTo = null;
  }

  if (user.role === UserRole.AGENT && sla === "at_risk") {
    where.status = { not: "RESOLVED" };
    const atRiskRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT t.id
      FROM tickets t
      WHERE t.org_id = ${user.orgId}
        AND t.status != 'RESOLVED'
        AND EXISTS (
          SELECT 1 FROM messages m
          INNER JOIN users u ON u.id = m.author_id
          WHERE m.ticket_id = t.id AND u.role = 'CUSTOMER'
          AND m.created_at = (
            SELECT MAX(m2.created_at) FROM messages m2 WHERE m2.ticket_id = t.id
          )
          AND m.created_at < NOW() - INTERVAL '60 minutes'
        )
    `;
    where.id = { in: atRiskRows.map((row) => row.id) };
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { messages: { some: { body: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const tickets = await prisma.ticket.findMany({
    where,
    select: ticketSelect,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  const ticketIds = tickets.map((t) => t.id);

  const lastCustomerMessages = ticketIds.length
    ? await prisma.$queryRaw<Array<{ ticket_id: string; created_at: Date }>>`
        SELECT DISTINCT ON (m.ticket_id) m.ticket_id, m.created_at
        FROM messages m
        INNER JOIN users u ON u.id = m.author_id
        WHERE m.ticket_id = ANY(${ticketIds}::text[])
          AND u.role = 'CUSTOMER'
        ORDER BY m.ticket_id, m.created_at DESC
      `
    : [];

  const lastMessageMap = new Map(
    lastCustomerMessages.map((row) => [row.ticket_id, row.created_at])
  );

  const summaries = tickets.map((ticket) => {
    const lastCustomerMessageAt = lastMessageMap.get(ticket.id) ?? null;
    return {
      ...serializeTicket(ticket),
      lastCustomerMessageAt: lastCustomerMessageAt?.toISOString() ?? null,
      minutesSinceCustomerMessage: minutesSince(lastCustomerMessageAt),
    };
  });

  return NextResponse.json({ tickets: summaries });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  if (user.role !== UserRole.CUSTOMER) {
    return jsonError("Only customers can create tickets", 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = createTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error), { status: 400 });
  }

  const ticketNumber = await getNextTicketNumber(user.orgId);

  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.ticket.create({
      data: {
        orgId: user.orgId,
        ticketNumber,
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        createdBy: user.id,
        messages: {
          create: {
            authorId: user.id,
            body: parsed.data.description,
          },
        },
        events: {
          create: [
            {
              type: TicketEventType.CREATED,
              actorId: user.id,
              payload: {
                title: parsed.data.title,
                priority: parsed.data.priority,
              },
            },
            {
              type: TicketEventType.MESSAGE_POSTED,
              actorId: user.id,
              payload: { preview: parsed.data.description.slice(0, 80) },
            },
          ],
        },
      },
      select: ticketSelect,
    });
    return created;
  });

  const serialized = serializeTicket(ticket);

  publishToOrg(user.orgId, {
    type: "ticket.updated",
    data: {
      ticketId: ticket.id,
      ticket: {
        id: ticket.id,
        status: ticket.status,
        assignedTo: ticket.assignedTo,
        assigneeName: null,
        updatedAt: ticket.updatedAt.toISOString(),
      },
    },
  });

  return NextResponse.json({ ticket: serialized }, { status: 201 });
}
