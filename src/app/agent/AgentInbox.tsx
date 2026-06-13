"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AgentLayout } from "@/components/AgentLayout";
import { PriorityBadge, SlaBadge, StatCard, StatusBadge, TicketRef } from "@/components/ui";
import { useRealtime } from "@/hooks/useRealtime";
import { formatRelativeTime } from "@/lib/utils";
import type { DashboardStats, TicketSummary } from "@/types";

const STATUSES = ["", "OPEN", "PENDING", "RESOLVED"] as const;
const PRIORITIES = ["", "LOW", "NORMAL", "HIGH", "URGENT"] as const;

export default function AgentInbox() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const urlStatus = searchParams.get("status") ?? "";
  const urlSla = searchParams.get("sla") ?? "";

  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [status, setStatus] = useState(urlStatus);
  const [priority, setPriority] = useState("");
  const [assigned, setAssigned] = useState(view === "mine" ? "me" : view === "unassigned" ? "unassigned" : "any");
  const [query, setQuery] = useState("");

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/dashboard/stats");
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (assigned !== "any") params.set("assigned", assigned);
    if (urlSla === "at_risk") params.set("sla", "at_risk");
    if (query.trim()) params.set("q", query.trim());

    const res = await fetch(`/api/tickets?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setTickets(data.tickets);
    }
  }, [status, priority, assigned, urlSla, query]);

  useEffect(() => {
    loadStats();
    loadTickets();
  }, [loadStats, loadTickets]);

  useEffect(() => {
    setStatus(urlStatus);
    setAssigned(view === "mine" ? "me" : view === "unassigned" ? "unassigned" : "any");
  }, [view, urlStatus]);

  useRealtime(null, {
    onTicketUpdate: () => {
      loadTickets();
      loadStats();
    },
    onMessage: () => {
      loadTickets();
      loadStats();
    },
  });

  const openActive = urlStatus === "OPEN" && !urlSla;
  const pendingActive = urlStatus === "PENDING" && !urlSla;
  const unassignedActive = view === "unassigned" && !urlStatus && !urlSla;
  const mineActive = view === "mine" && !urlStatus && !urlSla;
  const slaActive = urlSla === "at_risk";

  return (
    <AgentLayout>
      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard
            label="Open"
            value={stats.open}
            accent="text-emerald-600"
            href={openActive ? "/agent" : "/agent?status=OPEN"}
            active={openActive}
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            accent="text-amber-600"
            href={pendingActive ? "/agent" : "/agent?status=PENDING"}
            active={pendingActive}
          />
          <StatCard
            label="Unassigned"
            value={stats.unassigned}
            accent="text-orange-600"
            href={unassignedActive ? "/agent" : "/agent?view=unassigned"}
            active={unassignedActive}
          />
          <StatCard
            label="Assigned to me"
            value={stats.mine}
            accent="text-indigo-600"
            href={mineActive ? "/agent" : "/agent?view=mine"}
            active={mineActive}
          />
          <StatCard
            label="SLA at risk"
            value={stats.slaAtRisk}
            accent="text-rose-600"
            href={slaActive ? "/agent" : "/agent?sla=at_risk"}
            active={slaActive}
          />
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadTickets()}
          placeholder="Search tickets, messages…"
          className="min-w-[240px] flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm">
          {STATUSES.map((s) => (
            <option key={s || "all"} value={s}>{s || "All statuses"}</option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm">
          {PRIORITIES.map((p) => (
            <option key={p || "all"} value={p}>{p || "All priorities"}</option>
          ))}
        </select>
        <select value={assigned} onChange={(e) => setAssigned(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm">
          <option value="any">All assignments</option>
          <option value="me">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
        </select>
        <button onClick={loadTickets} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Search
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Assignee</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">SLA</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">No tickets match your filters.</td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id} className="transition hover:bg-indigo-50/50">
                  <td className="px-4 py-3">
                    <Link href={`/agent/tickets/${ticket.id}`}><TicketRef ref_={ticket.ticketRef} /></Link>
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <Link href={`/agent/tickets/${ticket.id}`} className="font-medium text-slate-900 hover:text-indigo-600">{ticket.title}</Link>
                    {ticket.lastMessagePreview && <p className="mt-0.5 truncate text-xs text-slate-500">{ticket.lastMessagePreview}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{ticket.creatorName}</td>
                  <td className="px-4 py-3">
                    {ticket.assigneeName ? (
                      <span className="text-slate-700">{ticket.assigneeName}</span>
                    ) : (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                  <td className="px-4 py-3"><SlaBadge minutes={ticket.minutesSinceCustomerMessage} /></td>
                  <td className="px-4 py-3 text-slate-500">{formatRelativeTime(ticket.updatedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AgentLayout>
  );
}
