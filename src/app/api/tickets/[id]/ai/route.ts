import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isErrorResponse, jsonError, requireUser } from "@/lib/api-helpers";
import { runAiAssist } from "@/lib/ai";

type RouteContext = { params: Promise<{ id: string }> };
type AiAction = "summarize" | "suggest-reply" | "customer-insight";

export async function POST(request: Request, context: RouteContext) {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { action?: AiAction };
  const action = body.action ?? "summarize";

  const ticket = await prisma.ticket.findFirst({
    where: {
      id,
      orgId: user.orgId,
      ...(user.role === UserRole.CUSTOMER ? { createdBy: user.id } : {}),
    },
    select: {
      title: true,
      status: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 30,
        select: {
          body: true,
          author: { select: { name: true, role: true } },
        },
      },
    },
  });

  if (!ticket) {
    return jsonError("Ticket not found", 404);
  }

  if (user.role === UserRole.CUSTOMER && !["summarize", "customer-insight"].includes(action)) {
    return jsonError("Not available for customers", 403);
  }

  if (user.role === UserRole.AGENT && action === "customer-insight") {
    return jsonError("Use summarize or suggest-reply", 400);
  }

  try {
    const result = await runAiAssist(ticket, action, {
      forCustomer: user.role === UserRole.CUSTOMER,
    });
    return NextResponse.json({ ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return jsonError(message, 503);
  }
}
