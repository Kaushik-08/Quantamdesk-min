import { PrismaClient, TicketEventType, TicketPriority, TicketStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

type SeedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

type SeedTicket = {
  ticketNumber: number;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  customerId: string;
  agentId: string | null;
  messages: Array<{ authorKey: "customer" | "agent"; body: string; offsetMin: number }>;
};

const AGENTS: SeedUser[] = [
  { id: "agent-alex", email: "alex.chen@quantumdesk.io", name: "Alex Chen", role: UserRole.AGENT },
  { id: "agent-priya", email: "priya.sharma@quantumdesk.io", name: "Priya Sharma", role: UserRole.AGENT },
  { id: "agent-marcus", email: "marcus.johnson@quantumdesk.io", name: "Marcus Johnson", role: UserRole.AGENT },
];

const CUSTOMERS: SeedUser[] = [
  { id: "cust-sam", email: "sam.ortiz@acmecorp.com", name: "Sam Ortiz", role: UserRole.CUSTOMER },
  { id: "cust-jordan", email: "jordan.lee@acmecorp.com", name: "Jordan Lee", role: UserRole.CUSTOMER },
  { id: "cust-taylor", email: "taylor.nguyen@acmecorp.com", name: "Taylor Nguyen", role: UserRole.CUSTOMER },
  { id: "cust-riley", email: "riley.patel@acmecorp.com", name: "Riley Patel", role: UserRole.CUSTOMER },
  { id: "cust-casey", email: "casey.morgan@acmecorp.com", name: "Casey Morgan", role: UserRole.CUSTOMER },
];

const TICKETS: SeedTicket[] = [
  {
    ticketNumber: 1042,
    title: "Cannot reset password — no email received",
    description: "User tried password reset twice over 24h. Confirmation emails never arrive. Urgent — locked out of billing portal.",
    priority: TicketPriority.URGENT,
    status: TicketStatus.OPEN,
    customerId: "cust-sam",
    agentId: "agent-alex",
    messages: [
      { authorKey: "customer", body: "Hi, I tried resetting my password but never received the email. I checked spam too.", offsetMin: 180 },
      { authorKey: "agent", body: "Thanks Sam — I can see two reset attempts in our logs. Can you confirm the email on file is sam.ortiz@acmecorp.com?", offsetMin: 150 },
      { authorKey: "customer", body: "Yes that's correct. Still nothing in inbox or spam.", offsetMin: 120 },
    ],
  },
  {
    ticketNumber: 1041,
    title: "Invoice #INV-8821 shows wrong tax amount",
    description: "Q1 invoice tax line item doesn't match our exemption certificate on file.",
    priority: TicketPriority.HIGH,
    status: TicketStatus.PENDING,
    customerId: "cust-jordan",
    agentId: "agent-priya",
    messages: [
      { authorKey: "customer", body: "Our latest invoice has 8.5% tax applied but we have a valid exemption cert.", offsetMin: 300 },
      { authorKey: "agent", body: "I've escalated to billing. Can you attach the cert number? I'll mark this pending until finance responds.", offsetMin: 260 },
    ],
  },
  {
    ticketNumber: 1040,
    title: "API rate limits too aggressive on staging",
    description: "Staging keys throttled at 60 req/min — blocking QA automation suite.",
    priority: TicketPriority.HIGH,
    status: TicketStatus.OPEN,
    customerId: "cust-taylor",
    agentId: null,
    messages: [
      { authorKey: "customer", body: "Our CI pipeline keeps hitting 429s on the staging API since Tuesday's deploy.", offsetMin: 90 },
    ],
  },
  {
    ticketNumber: 1039,
    title: "Request: export all tickets to CSV",
    description: "Need bulk export for compliance audit next week.",
    priority: TicketPriority.NORMAL,
    status: TicketStatus.OPEN,
    customerId: "cust-riley",
    agentId: null,
    messages: [
      { authorKey: "customer", body: "Is there a way to export our full ticket history? We need it for a SOC2 audit.", offsetMin: 400 },
    ],
  },
  {
    ticketNumber: 1038,
    title: "SSO login redirect loop with Okta",
    description: "Users bounced between login and dashboard after IdP change.",
    priority: TicketPriority.HIGH,
    status: TicketStatus.PENDING,
    customerId: "cust-casey",
    agentId: "agent-marcus",
    messages: [
      { authorKey: "customer", body: "After we updated Okta metadata, ~12 users get stuck in a redirect loop.", offsetMin: 500 },
      { authorKey: "agent", body: "Marcus here — I've reproduced on our side. Waiting on your updated SAML assertion URL.", offsetMin: 450 },
      { authorKey: "customer", body: "Sent the new metadata XML to your secure upload link.", offsetMin: 420 },
    ],
  },
  {
    ticketNumber: 1037,
    title: "Mobile app push notifications stopped working",
    description: "iOS users report no push since v2.4 release.",
    priority: TicketPriority.NORMAL,
    status: TicketStatus.RESOLVED,
    customerId: "cust-sam",
    agentId: "agent-alex",
    messages: [
      { authorKey: "customer", body: "Push notifications stopped after the 2.4 update on iOS.", offsetMin: 2000 },
      { authorKey: "agent", body: "Fixed in 2.4.1 — APNs cert had expired. Please update and confirm.", offsetMin: 1900 },
      { authorKey: "customer", body: "Confirmed working. Thanks!", offsetMin: 1800 },
    ],
  },
  {
    ticketNumber: 1036,
    title: "Add second admin seat to our plan",
    description: "Growing support team — need one more agent license.",
    priority: TicketPriority.LOW,
    status: TicketStatus.RESOLVED,
    customerId: "cust-jordan",
    agentId: "agent-priya",
    messages: [
      { authorKey: "customer", body: "We'd like to add one more agent seat. What's the process?", offsetMin: 3000 },
      { authorKey: "agent", body: "I've added the seat and sent the updated invoice. You're all set.", offsetMin: 2900 },
    ],
  },
  {
    ticketNumber: 1035,
    title: "Webhook deliveries failing with 502",
    description: "ticket.created webhooks failing intermittently since Friday.",
    priority: TicketPriority.HIGH,
    status: TicketStatus.OPEN,
    customerId: "cust-taylor",
    agentId: "agent-marcus",
    messages: [
      { authorKey: "customer", body: "Our webhook endpoint logs show 502s from your delivery service.", offsetMin: 60 },
      { authorKey: "agent", body: "Seeing elevated errors in us-east-1. Engineering is investigating — I'll update within the hour.", offsetMin: 30 },
    ],
  },
];

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "acme" },
    update: { name: "Acme Corp" },
    create: { id: "org-acme", name: "Acme Corp", slug: "acme" },
  });

  const allUsers = [...AGENTS, ...CUSTOMERS];
  const userMap = new Map<string, string>();

  for (const u of allUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, orgId: org.id },
      create: { id: u.id, email: u.email, name: u.name, role: u.role, orgId: org.id },
    });
    userMap.set(u.id, user.id);
  }

  for (const t of TICKETS) {
    const existing = await prisma.ticket.findUnique({
      where: { orgId_ticketNumber: { orgId: org.id, ticketNumber: t.ticketNumber } },
    });
    if (existing) continue;

    const customerId = userMap.get(t.customerId)!;
    const agentId = t.agentId ? userMap.get(t.agentId) ?? null : null;
    const baseTime = Date.now();

    const ticket = await prisma.ticket.create({
      data: {
        orgId: org.id,
        ticketNumber: t.ticketNumber,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        createdBy: customerId,
        assignedTo: agentId,
        createdAt: new Date(baseTime - t.messages[0].offsetMin * 60000),
        events: {
          create: [
            {
              type: TicketEventType.CREATED,
              actorId: customerId,
              payload: { title: t.title, priority: t.priority },
              createdAt: new Date(baseTime - t.messages[0].offsetMin * 60000),
            },
            ...(agentId
              ? [{
                  type: TicketEventType.ASSIGNED,
                  actorId: agentId,
                  payload: { to: agentId },
                  createdAt: new Date(baseTime - (t.messages[0].offsetMin - 5) * 60000),
                }]
              : []),
          ],
        },
      },
    });

    for (const msg of t.messages) {
      const authorId = msg.authorKey === "customer" ? customerId : agentId ?? customerId;
      await prisma.message.create({
        data: {
          ticketId: ticket.id,
          authorId,
          body: msg.body,
          createdAt: new Date(baseTime - msg.offsetMin * 60000),
        },
      });
      await prisma.ticketEvent.create({
        data: {
          ticketId: ticket.id,
          actorId: authorId,
          type: TicketEventType.MESSAGE_POSTED,
          payload: { preview: msg.body.slice(0, 80) },
          createdAt: new Date(baseTime - msg.offsetMin * 60000),
        },
      });
    }

    if (t.status !== TicketStatus.OPEN) {
      await prisma.ticketEvent.create({
        data: {
          ticketId: ticket.id,
          actorId: agentId,
          type: TicketEventType.STATUS_CHANGED,
          payload: { to: t.status },
        },
      });
    }
  }

  console.log("\n✓ QuantumDesk seed complete\n");
  console.log("Organization: Acme Corp (acme)");
  console.log("\nAgent accounts (password: demo123):");
  AGENTS.forEach((a) => console.log(`  ${a.email}`));
  console.log("\nCustomer accounts (password: demo123):");
  CUSTOMERS.forEach((c) => console.log(`  ${c.email}`));
  console.log(`\nTickets: ${TICKETS.length} realistic conversations loaded\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
