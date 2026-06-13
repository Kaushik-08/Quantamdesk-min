import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  isErrorResponse,
  jsonError,
  requireUser,
  serializeMessage,
  serializeTicket,
  messageSelect,
  ticketSelect,
} from "@/lib/api-helpers";
import { listMessagesQuerySchema, validationError } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const { id } = await context.params;
  const ticket = await prisma.ticket.findFirst({
    where: { id, orgId: user.orgId },
    select: ticketSelect,
  });

  if (!ticket) {
    return jsonError("Ticket not found", 404);
  }

  if (user.role === UserRole.CUSTOMER && ticket.createdBy !== user.id) {
    return jsonError("Forbidden", 403);
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = listMessagesQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error), { status: 400 });
  }

  const { cursor, limit } = parsed.data;

  const messages = await prisma.message.findMany({
    where: { ticketId: id },
    select: messageSelect,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
  });

  const hasMore = messages.length > limit;
  const page = hasMore ? messages.slice(0, limit) : messages;
  const ordered = page.reverse().map(serializeMessage);

  return NextResponse.json({
    ticket: serializeTicket(ticket),
    messages: ordered,
    nextCursor: hasMore ? page[0]?.id ?? null : null,
    hasMore,
  });
}
