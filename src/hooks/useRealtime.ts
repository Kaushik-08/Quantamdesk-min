"use client";

import { useEffect, useRef } from "react";
import type { MessageCreatedPayload, TicketUpdatedPayload } from "@/types/realtime";

type Handlers = {
  onMessage?: (data: MessageCreatedPayload) => void;
  onTicketUpdate?: (data: TicketUpdatedPayload) => void;
};

export function useRealtime(ticketId: string | null, handlers: Handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const params = ticketId ? `?ticketId=${encodeURIComponent(ticketId)}` : "";
    const source = new EventSource(`/api/events/stream${params}`);

    source.addEventListener("message.created", (event) => {
      const data = JSON.parse(event.data) as MessageCreatedPayload;
      handlersRef.current.onMessage?.(data);
    });

    source.addEventListener("ticket.updated", (event) => {
      const data = JSON.parse(event.data) as TicketUpdatedPayload;
      handlersRef.current.onTicketUpdate?.(data);
    });

    source.addEventListener("ticket.assigned", (event) => {
      const data = JSON.parse(event.data) as TicketUpdatedPayload;
      handlersRef.current.onTicketUpdate?.(data);
    });

    return () => source.close();
  }, [ticketId]);
}
