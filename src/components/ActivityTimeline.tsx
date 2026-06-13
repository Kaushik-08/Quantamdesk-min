"use client";

import { formatRelativeTime } from "@/lib/utils";

export type TimelineEvent = {
  id: string;
  type: string;
  payload: unknown;
  actorName: string | null;
  createdAt: string;
};

const EVENT_META: Record<string, { label: string }> = {
  CREATED: { label: "Ticket created" },
  MESSAGE_POSTED: { label: "Message sent" },
  STATUS_CHANGED: { label: "Status changed" },
  ASSIGNED: { label: "Assigned to agent" },
  UNASSIGNED: { label: "Unassigned" },
};

function formatPayload(type: string, payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;

  if (type === "STATUS_CHANGED") {
    const from = p.from as string | undefined;
    const to = p.to as string | undefined;
    if (from && to) return `${from} → ${to}`;
    if (to) return `Set to ${to}`;
  }
  if (type === "CREATED" && typeof p.title === "string") {
    return p.title;
  }
  if (type === "MESSAGE_POSTED" && typeof p.preview === "string") {
    return p.preview;
  }
  if (type === "ASSIGNED") {
    return "An agent is now handling your ticket";
  }
  return null;
}

export function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">No activity yet</p>;
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" />
      <ul className="space-y-5">
        {events.map((event, index) => {
          const meta = EVENT_META[event.type] ?? { label: event.type.replace(/_/g, " ") };
          const detail = formatPayload(event.type, event.payload);

          return (
            <li key={event.id} className="relative flex gap-3 pl-1">
              <div
                className={`relative z-10 mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 ${
                  index === 0 ? "border-indigo-500 bg-indigo-500" : "border-slate-300 bg-white"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{meta.label}</p>
                  {index === 0 && (
                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                      Latest
                    </span>
                  )}
                </div>
                {detail && <p className="mt-1 text-sm text-slate-600">{detail}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  {event.actorName ?? "System"} · {formatRelativeTime(event.createdAt)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function TicketProgress({ status }: { status: string }) {
  const steps = [
    { key: "OPEN", label: "Submitted", description: "We received your request" },
    { key: "PENDING", label: "In progress", description: "Our team is working on it" },
    { key: "RESOLVED", label: "Resolved", description: "This ticket is closed" },
  ];

  const order = ["OPEN", "PENDING", "RESOLVED"];
  const currentIdx = Math.max(0, order.indexOf(status));

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const reached = i <= currentIdx;
        const active = step.key === status;

        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  active
                    ? "bg-indigo-600 text-white"
                    : reached
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {reached && !active ? "✓" : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`my-1 h-8 w-0.5 ${i < currentIdx ? "bg-indigo-300" : "bg-slate-200"}`} />
              )}
            </div>
            <div className="pb-4 pt-1">
              <p className={`text-sm font-medium ${active ? "text-indigo-700" : reached ? "text-slate-800" : "text-slate-400"}`}>
                {step.label}
              </p>
              <p className={`text-xs ${active ? "text-slate-600" : "text-slate-400"}`}>
                {active ? step.description : reached ? "Completed" : "Upcoming"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
