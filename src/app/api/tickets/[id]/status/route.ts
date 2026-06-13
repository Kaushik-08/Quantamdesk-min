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
import { updateStatusSchema, validationError } from "@/lib/validation";
import { publishToOrg } from "@/lib/realtime";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  if (user.role !== UserRole.AGENT) {
    return jsonError("Only agents can update ticket status", 403);
  }

  const { id } = await context.params;

  const existing = await prisma.ticket.findFirst({
    where: { id, orgId: user.orgId },
    select: { id: true, status: true },
  });

  if (!existing) {
    return jsonError("Ticket not found", 404);
  }

  const body = await request.json().catch(() => null);
  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error), { status: 400 });
  }

  if (existing.status === parsed.data.status) {
    const ticket = await prisma.ticket.findUniqueOrThrow({
      where: { id },
      select: ticketSelect,
    });
    return NextResponse.json({ ticket: serializeTicket(ticket) });
  }

  const ticket = await prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where: { id },
      data: { status: parsed.data.status },
      select: ticketSelect,
    });

    await tx.ticketEvent.create({
      data: {
        ticketId: id,
        actorId: user.id,
        type: TicketEventType.STATUS_CHANGED,
        payload: {
          from: existing.status,
          to: parsed.data.status,
        },
      },
    });

    return updated;
  });

  const serialized = serializeTicket(ticket);

  publishToOrg(user.orgId, {
    type: "ticket.updated",
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
