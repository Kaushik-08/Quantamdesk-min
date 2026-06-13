"use client";

import { formatRelativeTime } from "@/lib/utils";

export type TimelineEvent = {
  id: string;
  type: string;
  payload: unknown;
  actorName: string | null;
  createdAt: string;
};

const EVENT_META: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  CREATED: { icon: "🎫", label: "Ticket created", color: "text-indigo-600", bg: "bg-indigo-100" },
  MESSAGE_POSTED: { icon: "💬", label: "Message sent", color: "text-blue-600", bg: "bg-blue-100" },
  STATUS_CHANGED: { icon: "🔄", label: "Status changed", color: "text-amber-600", bg: "bg-amber-100" },
  ASSIGNED: { icon: "👤", label: "Assigned", color: "text-emerald-600", bg: "bg-emerald-100" },
  UNASSIGNED: { icon: "📋", label: "Unassigned", color: "text-slate-600", bg: "bg-slate-100" },
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
    return `"${p.title}"`;
  }
  if (type === "MESSAGE_POSTED" && typeof p.preview === "string") {
    return `"${p.preview}"`;
  }
  if (type === "ASSIGNED" && p.to) {
    return "Agent took ownership";
  }
  return null;
}

export function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-xs text-slate-400">No activity yet</p>;
  }

  return (
    <div className="relative">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-indigo-200 via-slate-200 to-transparent" />
      <ul className="space-y-4">
        {events.map((event, index) => {
          const meta = EVENT_META[event.type] ?? {
            icon: "•",
            label: event.type.replace(/_/g, " "),
            color: "text-slate-600",
            bg: "bg-slate-100",
          };
          const detail = formatPayload(event.type, event.payload);

          return (
            <li key={event.id} className="relative flex gap-3 pl-1">
              <div
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${meta.bg}`}
              >
                {meta.icon}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-semibold ${meta.color}`}>{meta.label}</p>
                  {index === 0 && (
                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
                      Latest
                    </span>
                  )}
                </div>
                {detail && (
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{detail}</p>
                )}
                <p className="mt-1 text-[11px] text-slate-400">
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
    { key: "OPEN", label: "Submitted", icon: "📝" },
    { key: "PENDING", label: "In progress", icon: "⏳" },
    { key: "RESOLVED", label: "Resolved", icon: "✅" },
  ];

  const order = ["OPEN", "PENDING", "RESOLVED"];
  const currentIdx = order.indexOf(status);

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const done = i <= currentIdx;
        const active = step.key === status;
        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition ${
                  active
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                    : done
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {step.icon}
              </div>
              {i < steps.length - 1 && (
                <div className={`my-1 h-6 w-0.5 ${done && i < currentIdx ? "bg-emerald-300" : "bg-slate-200"}`} />
              )}
            </div>
            <div className="pt-1.5">
              <p className={`text-xs font-medium ${active ? "text-indigo-700" : done ? "text-slate-700" : "text-slate-400"}`}>
                {step.label}
              </p>
              {active && <p className="text-[10px] text-indigo-500">Current stage</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
