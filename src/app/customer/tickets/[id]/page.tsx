import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";
import { serializeMessage, serializeTicket, ticketSelect, messageSelect } from "@/lib/api-helpers";
import { CustomerTicketView } from "@/components/CustomerTicketView";

type PageProps = { params: Promise<{ id: string }> };

export default async function CustomerTicketPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== UserRole.CUSTOMER) redirect("/customer");

  const ticket = await prisma.ticket.findFirst({
    where: { id, orgId: user.orgId, createdBy: user.id },
    select: ticketSelect,
  });
  if (!ticket) notFound();

  const messages = await prisma.message.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: "desc" },
    take: 31,
    select: messageSelect,
  });

  const hasMore = messages.length > 30;
  const page = hasMore ? messages.slice(0, 30) : messages;
  const serialized = serializeTicket(ticket);

  return (
    <CustomerTicketView
      ticket={serialized}
      initialMessages={page.reverse().map(serializeMessage)}
      initialNextCursor={hasMore ? page[0]?.id ?? null : null}
      initialHasMore={hasMore}
      currentUserId={user.id}
    />
  );
}
