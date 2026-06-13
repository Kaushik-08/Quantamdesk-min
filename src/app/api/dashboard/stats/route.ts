import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isErrorResponse, requireUser } from "@/lib/api-helpers";

export async function GET() {
  const user = await requireUser();
  if (isErrorResponse(user)) return user;

  if (user.role !== UserRole.AGENT) {
    return NextResponse.json({ error: "Agents only" }, { status: 403 });
  }

  const baseWhere = { orgId: user.orgId };

  const [open, pending, unassigned, mine, slaAtRisk] = await Promise.all([
    prisma.ticket.count({ where: { ...baseWhere, status: "OPEN" } }),
    prisma.ticket.count({ where: { ...baseWhere, status: "PENDING" } }),
    prisma.ticket.count({ where: { ...baseWhere, assignedTo: null, status: { not: "RESOLVED" } } }),
    prisma.ticket.count({ where: { ...baseWhere, assignedTo: user.id, status: { not: "RESOLVED" } } }),
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
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
    `,
  ]);

  return NextResponse.json({
    stats: {
      open,
      pending,
      unassigned,
      mine,
      slaAtRisk: Number(slaAtRisk[0]?.count ?? 0),
      resolved: await prisma.ticket.count({ where: { ...baseWhere, status: "RESOLVED" } }),
    },
  });
}
