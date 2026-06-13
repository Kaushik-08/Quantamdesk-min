import { NextResponse } from "next/server";
import { TicketEventType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  isErrorResponse,
  jsonError,
  requireUser,
  serializeTicket,
  ticketSelect,
} from "@/lib/api-helpers";
import { publishToOrg } from "@/lib/realtime";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  if (user.role !== UserRole.AGENT) {
    return jsonError("Only agents can assign tickets", 403);
  }

  const { id } = await context.params;

  const existing = await prisma.ticket.findFirst({
    where: { id, orgId: user.orgId },
    select: { id: true, assignedTo: true },
  });

  if (!existing) {
    return jsonError("Ticket not found", 404);
  }

  if (existing.assignedTo === user.id) {
    const ticket = await prisma.ticket.findUniqueOrThrow({
      where: { id },
      select: ticketSelect,
    });
    return NextResponse.json({ ticket: serializeTicket(ticket) });
  }

  const eventType =
    existing.assignedTo && existing.assignedTo !== user.id
      ? TicketEventType.ASSIGNED
      : existing.assignedTo === null
        ? TicketEventType.ASSIGNED
        : TicketEventType.ASSIGNED;

  const ticket = await prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where: { id },
      data: { assignedTo: user.id },
      select: ticketSelect,
    });

    await tx.ticketEvent.create({
      data: {
        ticketId: id,
        actorId: user.id,
        type: eventType,
        payload: {
          from: existing.assignedTo,
          to: user.id,
        },
      },
    });

    return updated;
  });

  const serialized = serializeTicket(ticket);

  publishToOrg(user.orgId, {
    type: "ticket.assigned",
    data: {
      ticketId: id,
      ticket: {
        id: ticket.id,
        status: ticket.status,
        assignedTo: ticket.assignedTo,
        assigneeName: ticket.assignee?.name ?? null,
        updatedAt: ticket.updatedAt.toISOString(),
      },
    },
  });

  return NextResponse.json({ ticket: serialized });
}
