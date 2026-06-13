import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { subscribe } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { orgId: true, role: true },
  });

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const requestedTicketId = request.nextUrl.searchParams.get("ticketId");
  let ticketIds: Set<string> | "all";

  if (user.role === UserRole.AGENT) {
    ticketIds =
      requestedTicketId != null && requestedTicketId.length > 0
        ? new Set([requestedTicketId])
        : "all";
  } else {
    const owned = await prisma.ticket.findMany({
      where: { orgId: user.orgId, createdBy: userId },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((t) => t.id));

    if (requestedTicketId != null && requestedTicketId.length > 0) {
      if (!ownedIds.has(requestedTicketId)) {
        return new Response("Forbidden", { status: 403 });
      }
      ticketIds = new Set([requestedTicketId]);
    } else {
      ticketIds = ownedIds;
    }
  }

  let cleanup: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      cleanup = subscribe(user.orgId, ticketIds, controller);
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"));
        } catch {
          if (heartbeat) clearInterval(heartbeat);
        }
      }, 25000);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
