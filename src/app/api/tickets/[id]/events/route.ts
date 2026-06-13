import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isErrorResponse, jsonError, requireUser } from "@/lib/api-helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const { id } = await context.params;

  const ticket = await prisma.ticket.findFirst({
    where: {
      id,
      orgId: user.orgId,
      ...(user.role === UserRole.CUSTOMER ? { createdBy: user.id } : {}),
    },
    select: { id: true },
  });

  if (!ticket) {
    return jsonError("Ticket not found", 404);
  }

  const events = await prisma.ticketEvent.findMany({
    where: {
      ticketId: id,
      ...(user.role === UserRole.CUSTOMER
        ? { type: { in: ["CREATED", "STATUS_CHANGED", "ASSIGNED", "MESSAGE_POSTED"] } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: user.role === UserRole.CUSTOMER ? 10 : 50,
    include: {
      actor: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      type: e.type,
      payload: e.payload,
      actorName: e.actor?.name ?? null,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}
