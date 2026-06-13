"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AgentLayout } from "@/components/AgentLayout";
import { TicketThread } from "@/components/TicketThread";
import { AiAssistantPanel } from "@/components/AiAssistantPanel";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { PriorityBadge, StatusBadge, TicketRef } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useRealtime } from "@/hooks/useRealtime";
import { formatRelativeTime } from "@/lib/utils";
import type { MessageItem, TicketSummary } from "@/types";

type PageProps = { params: Promise<{ id: string }> };

type TicketEvent = {
  id: string;
  type: string;
  payload: unknown;
  actorName: string | null;
  createdAt: string;
};

export default function AgentTicketPage({ params }: PageProps) {
  const { user } = useAuth();
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketSummary | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setTicketId(p.id));
  }, [params]);

  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    const [detailRes, eventsRes] = await Promise.all([
      fetch(`/api/tickets/${ticketId}`),
      fetch(`/api/tickets/${ticketId}/events`),
    ]);

    if (detailRes.ok) {
      const detail = await detailRes.json();
      setTicket(detail.ticket);
      setMessages(detail.messages);
      setNextCursor(detail.nextCursor);
      setHasMore(detail.hasMore);
    }

    if (eventsRes.ok) {
      const eventsData = await eventsRes.json();
      setEvents(eventsData.events);
    }
    setLoading(false);
  }, [ticketId]);

  useEffect(() => {
    if (ticketId) loadTicket();
  }, [ticketId, loadTicket]);

  useRealtime(ticketId, {
    onMessage: (data) => {
      if (data.ticketId !== ticketId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    },
    onTicketUpdate: (data) => {
      if (data.ticketId !== ticketId) return;
      setTicket((prev) =>
        prev
          ? { ...prev, status: data.ticket.status, assignedTo: data.ticket.assignedTo, assigneeName: data.ticket.assigneeName, updatedAt: data.ticket.updatedAt }
          : prev
      );
    },
  });

  const updateStatus = async (status: string) => {
    if (!ticketId) return;
    const res = await fetch(`/api/tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = await res.json();
      setTicket((prev) => (prev ? { ...prev, ...data.ticket } : prev));
      loadTicket();
    }
  };

  const assignToMe = async () => {
    if (!ticketId) return;
    const res = await fetch(`/api/tickets/${ticketId}/assign`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setTicket((prev) => (prev ? { ...prev, ...data.ticket } : prev));
    }
  };

  if (loading || !ticket || !ticketId || !user) {
    return (
      <AgentLayout>
        <p className="text-slate-500">Loading ticket…</p>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <Link href="/agent" className="text-sm text-indigo-600 hover:underline">← Back to inbox</Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-wrap items-center gap-3">
              <TicketRef ref_={ticket.ticketRef} />
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="mt-2 text-xl font-semibold text-slate-900">{ticket.title}</h1>
            {ticket.description && (
              <p className="mt-2 text-sm text-slate-600">{ticket.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {(["OPEN", "PENDING", "RESOLVED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    ticket.status === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {s}
                </button>
              ))}
              <button onClick={assignToMe} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                Assign to me
              </button>
            </div>
          </div>
          <div className="p-6">
            <TicketThread
              ticketId={ticketId}
              initialMessages={messages}
              initialNextCursor={nextCursor}
              initialHasMore={hasMore}
              currentUserId={user.id}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Details</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Customer</dt>
                <dd className="font-medium">{ticket.creatorName}</dd>
                <dd className="text-xs text-slate-400">{ticket.creatorEmail}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Assignee</dt>
                <dd className="font-medium">{ticket.assigneeName ?? "Unassigned"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Created</dt>
                <dd>{formatRelativeTime(ticket.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Messages</dt>
                <dd>{ticket.messageCount}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Activity</h2>
            <div className="mt-4 max-h-72 overflow-y-auto">
              <ActivityTimeline events={events} />
            </div>
          </div>

          <AiAssistantPanel ticketId={ticketId} />
        </div>
      </div>
    </AgentLayout>
  );
}
