import type {
  RealtimeEvent,
  RealtimeEventType,
  MessageCreatedPayload,
  TicketUpdatedPayload,
  TicketAssignedPayload,
} from "@/types/realtime";

export type {
  RealtimeEventType,
  MessageCreatedPayload,
  TicketUpdatedPayload,
  TicketAssignedPayload,
  RealtimeEvent,
};

type Subscriber = {
  orgId: string;
  ticketIds: Set<string> | "all";
  controller: ReadableStreamDefaultController<Uint8Array>;
};

const subscribers = new Set<Subscriber>();
const encoder = new TextEncoder();

function formatSse(event: RealtimeEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

export function subscribe(
  orgId: string,
  ticketIds: Set<string> | "all",
  controller: ReadableStreamDefaultController<Uint8Array>
): () => void {
  const subscriber: Subscriber = { orgId, ticketIds, controller };
  subscribers.add(subscriber);

  controller.enqueue(encoder.encode(`: connected\n\n`));

  return () => {
    subscribers.delete(subscriber);
  };
}

function shouldReceive(subscriber: Subscriber, event: RealtimeEvent): boolean {
  if (subscriber.orgId !== event.orgId) return false;
  if (subscriber.ticketIds === "all") return true;
  return subscriber.ticketIds.has(event.data.ticketId);
}

export function publish(event: RealtimeEvent): void {
  const payload = encoder.encode(formatSse(event));

  for (const subscriber of subscribers) {
    if (!shouldReceive(subscriber, event)) continue;
    try {
      subscriber.controller.enqueue(payload);
    } catch {
      subscribers.delete(subscriber);
    }
  }
}

export function publishToOrg(orgId: string, event: Omit<RealtimeEvent, "orgId">): void {
  publish({ ...event, orgId } as RealtimeEvent);
}
