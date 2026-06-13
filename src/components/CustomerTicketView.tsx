"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ActivityTimeline, TicketProgress } from "@/components/ActivityTimeline";
import { CustomerAiHelper } from "@/components/CustomerAiHelper";
import { CustomerLayout } from "@/components/CustomerLayout";
import { TicketThread } from "@/components/TicketThread";
import { PriorityBadge, StatusBadge, TicketRef } from "@/components/ui";
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

export function CustomerTicketView({
  ticket,
  initialMessages,
  initialNextCursor,
  initialHasMore,
  currentUserId,
}: Props) {
  const [events, setEvents] = useState<Array<{ id: string; type: string; payload: unknown; actorName: string | null; createdAt: string }>>([]);

  useEffect(() => {
    fetch(`/api/tickets/${ticket.id}/events`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => {});
  }, [ticket.id]);

  return (
    <CustomerLayout>
      <Link href="/customer" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
        ← My tickets
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Conversation */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50/50 to-white px-6 py-5">
            <div className="flex flex-wrap items-center gap-2">
              <TicketRef ref_={ticket.ticketRef} />
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="mt-2 text-xl font-bold text-slate-900">{ticket.title}</h1>
            {ticket.description && (
              <p className="mt-2 text-sm text-slate-600">{ticket.description}</p>
            )}
            <p className="mt-2 text-xs text-slate-400">
              Opened {formatRelativeTime(ticket.createdAt)} · Updated {formatRelativeTime(ticket.updatedAt)}
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

        {/* Sidebar */}
        <div className="space-y-4">
          <CustomerAiHelper ticketId={ticket.id} />

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Ticket progress</h2>
            <div className="mt-4">
              <TicketProgress status={ticket.status} />
            </div>
          </div>

          {ticket.assigneeName && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Your agent</h2>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {ticket.assigneeName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{ticket.assigneeName}</p>
                  <p className="text-xs text-emerald-600">● Online · replies in real time</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
            <div className="mt-4 max-h-48 overflow-y-auto">
              <ActivityTimeline events={events} />
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
