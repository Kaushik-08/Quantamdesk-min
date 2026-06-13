"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CustomerLayout } from "@/components/CustomerLayout";
import { PriorityBadge, StatusBadge, TicketRef } from "@/components/ui";
import { useRealtime } from "@/hooks/useRealtime";
import { getValidationMessage } from "@/lib/form-errors";
import { formatRelativeTime } from "@/lib/utils";
import type { TicketSummary } from "@/types";

const STATUSES = ["", "OPEN", "PENDING", "RESOLVED"] as const;

export default function CustomerPortalPage() {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadTickets = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (query.trim()) params.set("q", query.trim());

    const res = await fetch(`/api/tickets?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setTickets(data.tickets);
    }
  }, [query, statusFilter]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useRealtime(null, {
    onTicketUpdate: () => loadTickets(),
    onMessage: () => loadTickets(),
  });

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    setError(null);

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: description.trim(), priority }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(getValidationMessage(data, "Failed to create ticket"));
    } else {
      setTitle("");
      setDescription("");
      setShowForm(false);
      await loadTickets();
    }
    setCreating(false);
  };

  const openCount = useMemo(() => tickets.filter((t) => t.status !== "RESOLVED").length, [tickets]);
  const resolvedCount = useMemo(() => tickets.filter((t) => t.status === "RESOLVED").length, [tickets]);

  return (
    <CustomerLayout>
      <div className="mb-8 rounded-2xl border border-slate-200 bg-indigo-600 px-6 py-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Support Portal</p>
            <h1 className="mt-2 text-2xl font-bold">My Support Tickets</h1>
            <p className="mt-2 text-sm text-indigo-100">
              {openCount} active · {resolvedCount} resolved
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="shrink-0 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            + New ticket
          </button>
        </div>
        <div className="mt-6 flex gap-3">
          {[
            { label: "Open", value: openCount },
            { label: "Resolved", value: resolvedCount },
            { label: "Total", value: tickets.length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-white/10 px-4 py-2 text-center">
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-indigo-200">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <form onSubmit={createTicket} className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Submit a request</h2>
          <p className="mt-1 text-sm text-slate-500">Subject needs at least 3 characters. Description at least 10.</p>
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Subject</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of your issue"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the issue — what happened, when, and any error messages"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1.5 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? "Submitting…" : "Submit ticket"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadTickets()}
          placeholder="Search your tickets…"
          className="min-w-[200px] flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm"
        >
          {STATUSES.map((s) => (
            <option key={s || "all"} value={s}>
              {s || "All statuses"}
            </option>
          ))}
        </select>
        <button
          onClick={loadTickets}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Search
        </button>
      </div>

      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-600">No tickets match your search.</p>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <TicketRef ref_={ticket.ticketRef} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <h3 className="mt-2 font-semibold text-slate-900">{ticket.title}</h3>
                  {ticket.lastMessagePreview && (
                    <p className="mt-1 truncate text-sm text-slate-600">{ticket.lastMessagePreview}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
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
