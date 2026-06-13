"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CustomerLayout } from "@/components/CustomerLayout";
import { PriorityBadge, StatusBadge, TicketRef } from "@/components/ui";
import { useRealtime } from "@/hooks/useRealtime";
import { formatRelativeTime } from "@/lib/utils";
import type { TicketSummary } from "@/types";

export default function CustomerPortalPage() {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    const res = await fetch("/api/tickets");
    if (res.ok) {
      const data = await res.json();
      setTickets(data.tickets);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useRealtime(null, {
    onTicketUpdate: () => loadTickets(),
    onMessage: () => loadTickets(),
  });

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || creating) return;
    setCreating(true);
    setError(null);

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: description.trim(), priority }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create ticket");
    } else {
      setTitle("");
      setDescription("");
      setShowForm(false);
      await loadTickets();
    }
    setCreating(false);
  };

  const openCount = tickets.filter((t) => t.status !== "RESOLVED").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;

  return (
    <CustomerLayout>
      {/* Hero */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-200">Support Portal</p>
            <h1 className="mt-1 text-2xl font-bold">My Support Tickets</h1>
            <p className="mt-2 text-sm text-indigo-100">
              {openCount} active · {resolvedCount} resolved — replies appear in real time
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="shrink-0 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50"
          >
            + New ticket
          </button>
        </div>
        <div className="mt-4 flex gap-3">
          <div className="rounded-lg bg-white/15 px-3 py-2 text-center backdrop-blur">
            <p className="text-lg font-bold">{openCount}</p>
            <p className="text-[10px] text-indigo-200">Open</p>
          </div>
          <div className="rounded-lg bg-white/15 px-3 py-2 text-center backdrop-blur">
            <p className="text-lg font-bold">{resolvedCount}</p>
            <p className="text-[10px] text-indigo-200">Resolved</p>
          </div>
          <div className="rounded-lg bg-white/15 px-3 py-2 text-center backdrop-blur">
            <p className="text-lg font-bold">{tickets.length}</p>
            <p className="text-[10px] text-indigo-200">Total</p>
          </div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={createTicket} className="mb-8 rounded-xl border border-indigo-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Submit a request</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Subject</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of your issue"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the issue in detail — steps to reproduce, error messages, etc."
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={creating} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {creating ? "Submitting…" : "Submit ticket"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-500">No tickets yet. Create one to start a conversation with our team.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/customer/tickets/${ticket.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <TicketRef ref_={ticket.ticketRef} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <h3 className="mt-1 font-semibold text-slate-900">{ticket.title}</h3>
                  {ticket.lastMessagePreview && (
                    <p className="mt-1 truncate text-sm text-slate-500">{ticket.lastMessagePreview}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    {ticket.messageCount} messages · Updated {formatRelativeTime(ticket.updatedAt)}
                    {ticket.assigneeName && ` · Agent: ${ticket.assigneeName}`}
                  </p>
                </div>
                <StatusBadge status={ticket.status} />
              </div>
            </Link>
          ))
        )}
      </div>
    </CustomerLayout>
  );
}
