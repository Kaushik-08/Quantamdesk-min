"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ActivityTimeline, TicketProgress } from "@/components/ActivityTimeline";
import { CustomerAiHelper } from "@/components/CustomerAiHelper";
import { CustomerLayout } from "@/components/CustomerLayout";
import { TicketThread } from "@/components/TicketThread";
import { PriorityBadge, StatusBadge, TicketRef } from "@/components/ui";
import { useRealtime } from "@/hooks/useRealtime";
import { formatRelativeTime } from "@/lib/utils";
import type { MessageItem } from "@/types";

type Props = {
  ticket: {
    id: string;
    ticketRef: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    assigneeName: string | null;
    createdAt: string;
    updatedAt: string;
  };
  initialMessages: MessageItem[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
  currentUserId: string;
};

type TimelineEvent = {
  id: string;
  type: string;
  payload: unknown;
  actorName: string | null;
  createdAt: string;
};

export function CustomerTicketView({
  ticket,
  initialMessages,
  initialNextCursor,
  initialHasMore,
  currentUserId,
}: Props) {
  const [status, setStatus] = useState(ticket.status);
  const [assigneeName, setAssigneeName] = useState(ticket.assigneeName);
  const [updatedAt, setUpdatedAt] = useState(ticket.updatedAt);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  const loadEvents = useCallback(async () => {
    const res = await fetch(`/api/tickets/${ticket.id}/events`);
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events ?? []);
    }
  }, [ticket.id]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useRealtime(ticket.id, {
    onMessage: () => {
      loadEvents();
    },
    onTicketUpdate: (data) => {
      if (data.ticketId !== ticket.id) return;
      setStatus(data.ticket.status);
      setAssigneeName(data.ticket.assigneeName);
      setUpdatedAt(data.ticket.updatedAt);
      loadEvents();
    },
  });

  return (
    <CustomerLayout>
      <Link
        href="/customer"
        className="inline-flex items-center gap-1 rounded-lg px-1 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
      >
        ← My tickets
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <div className="flex flex-wrap items-center gap-2">
              <TicketRef ref_={ticket.ticketRef} />
              <StatusBadge status={status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="mt-3 text-xl font-bold text-slate-900">{ticket.title}</h1>
            {ticket.description && (
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{ticket.description}</p>
            )}
            <p className="mt-3 text-xs text-slate-500">
              Opened {formatRelativeTime(ticket.createdAt)} · Updated {formatRelativeTime(updatedAt)}
            </p>
          </div>
          <div className="p-6">
            <TicketThread
              ticketId={ticket.id}
              initialMessages={initialMessages}
              initialNextCursor={initialNextCursor}
              initialHasMore={initialHasMore}
              currentUserId={currentUserId}
            />
          </div>
        </div>

        <div className="space-y-4">
          <CustomerAiHelper ticketId={ticket.id} />

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Ticket progress</h2>
            <div className="mt-4">
              <TicketProgress status={status} />
            </div>
          </div>

          {assigneeName && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Your agent</h2>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {assigneeName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{assigneeName}</p>
                  <p className="text-xs text-slate-500">Replies appear in real time</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
            <div className="mt-4 max-h-56 overflow-y-auto">
              <ActivityTimeline events={events} />
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
