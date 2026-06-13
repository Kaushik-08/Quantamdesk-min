export type TicketSummary = {
  id: string;
  ticketNumber: number;
  ticketRef: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  createdBy: string;
  creatorName: string;
  creatorEmail: string | null;
  assignedTo: string | null;
  assigneeName: string | null;
  messageCount: number;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  lastMessageAuthor: string | null;
  createdAt: string;
  updatedAt: string;
  lastCustomerMessageAt: string | null;
  minutesSinceCustomerMessage: number | null;
};

export type MessageItem = {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  orgId: string;
  orgName: string;
};

export type DashboardStats = {
  open: number;
  pending: number;
  unassigned: number;
  mine: number;
  slaAtRisk: number;
  resolved: number;
};

export type PaginatedMessages = {
  messages: MessageItem[];
  nextCursor: string | null;
  hasMore: boolean;
};
