import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import type { ApiError } from "@/lib/validation";

export function jsonError(error: string, status: number, details?: unknown) {
  const body: ApiError = details ? { error, details } : { error };
  return NextResponse.json(body, { status });
}

export async function requireUser(): Promise<SessionUser | NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) {
    return jsonError("Unauthorized — please sign in", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      orgId: true,
      organization: { select: { name: true } },
    },
  });

  if (!user) {
    return jsonError("Session expired", 401);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    orgId: user.orgId,
    orgName: user.organization.name,
  };
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export const ticketSelect = {
  id: true,
  ticketNumber: true,
  title: true,
  description: true,
  priority: true,
  status: true,
  createdBy: true,
  assignedTo: true,
  createdAt: true,
  updatedAt: true,
  creator: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true } },
  _count: { select: { messages: true } },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      body: true,
      createdAt: true,
      author: { select: { name: true, role: true } },
    },
  },
} as const;

export const messageSelect = {
  id: true,
  ticketId: true,
  authorId: true,
  body: true,
  createdAt: true,
  author: { select: { id: true, name: true, role: true } },
} as const;

export function formatTicketRef(ticketNumber: number): string {
  return `QD-${ticketNumber}`;
}

export function serializeMessage(message: {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  createdAt: Date;
  author: { id: string; name: string; role: string };
}) {
  return {
    id: message.id,
    ticketId: message.ticketId,
    authorId: message.authorId,
    authorName: message.author.name,
    authorRole: message.author.role,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  };
}

export function serializeTicket(ticket: {
  id: string;
  ticketNumber: number;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  createdBy: string;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
  creator: { id: string; name: string; email?: string };
  assignee: { id: string; name: string } | null;
  _count?: { messages: number };
  messages?: Array<{
    body: string;
    createdAt: Date;
    author: { name: string; role: string };
  }>;
}) {
  const lastMsg = ticket.messages?.[0];
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    ticketRef: formatTicketRef(ticket.ticketNumber),
    title: ticket.title,
    description: ticket.description ?? null,
    priority: ticket.priority,
    status: ticket.status,
    createdBy: ticket.createdBy,
    creatorName: ticket.creator.name,
    creatorEmail: ticket.creator.email ?? null,
    assignedTo: ticket.assignedTo,
    assigneeName: ticket.assignee?.name ?? null,
    messageCount: ticket._count?.messages ?? 0,
    lastMessagePreview: lastMsg?.body.slice(0, 120) ?? null,
    lastMessageAt: lastMsg?.createdAt.toISOString() ?? null,
    lastMessageAuthor: lastMsg?.author.name ?? null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

export async function getNextTicketNumber(orgId: string): Promise<number> {
  const result = await prisma.ticket.aggregate({
    where: { orgId },
    _max: { ticketNumber: true },
  });
  return (result._max.ticketNumber ?? 1041) + 1;
}

export function minutesSince(date: Date | null): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / 60000);
}
