export type RealtimeEventType =
  | "message.created"
  | "ticket.updated"
  | "ticket.assigned";

export type MessageCreatedPayload = {
  ticketId: string;
  message: {
    id: string;
    ticketId: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    body: string;
    createdAt: string;
  };
};

export type TicketUpdatedPayload = {
  ticketId: string;
  ticket: {
    id: string;
    status: string;
    assignedTo: string | null;
    assigneeName: string | null;
    updatedAt: string;
  };
};

export type TicketAssignedPayload = TicketUpdatedPayload;

export type RealtimeEvent =
  | { type: "message.created"; orgId: string; data: MessageCreatedPayload }
  | { type: "ticket.updated"; orgId: string; data: TicketUpdatedPayload }
  | { type: "ticket.assigned"; orgId: string; data: TicketAssignedPayload };
