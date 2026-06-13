import { NextResponse } from "next/server";
import { TicketEventType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  isErrorResponse,
  jsonError,
  requireUser,
  serializeMessage,
  messageSelect,
} from "@/lib/api-helpers";
import { postMessageSchema, validationError } from "@/lib/validation";
import { publishToOrg } from "@/lib/realtime";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const { id } = await context.params;

  const ticket = await prisma.ticket.findFirst({
    where: { id, orgId: user.orgId },
    select: { id: true, createdBy: true, status: true },
  });

  if (!ticket) {
    return jsonError("Ticket not found", 404);
  }

  if (user.role === UserRole.CUSTOMER && ticket.createdBy !== user.id) {
    return jsonError("Forbidden", 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = postMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error), { status: 400 });
  }

  const [message, ticketRow] = await prisma.$transaction([
    prisma.message.create({
      data: {
        ticketId: id,
        authorId: user.id,
        body: parsed.data.body,
      },
      select: messageSelect,
    }),
    prisma.ticket.update({
      where: { id },
      data: { updatedAt: new Date() },
      select: {
        status: true,
        assignedTo: true,
        updatedAt: true,
        assignee: { select: { name: true } },
      },
    }),
    prisma.ticketEvent.create({
      data: {
        ticketId: id,
        actorId: user.id,
        type: TicketEventType.MESSAGE_POSTED,
        payload: { preview: parsed.data.body.slice(0, 80) },
      },
    }),
  ]);

  const serialized = serializeMessage(message);

  publishToOrg(user.orgId, {
    type: "message.created",
    data: {
      ticketId: id,
      message: serialized,
    },
  });

  publishToOrg(user.orgId, {
    type: "ticket.updated",
    data: {
      ticketId: id,
      ticket: {
        id,
        status: ticketRow.status,
        assignedTo: ticketRow.assignedTo,
        assigneeName: ticketRow.assignee?.name ?? null,
        updatedAt: ticketRow.updatedAt.toISOString(),
      },
    },
  });

  return NextResponse.json({ message: serialized }, { status: 201 });
}
