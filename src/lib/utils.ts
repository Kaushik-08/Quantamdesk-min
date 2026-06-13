import type { TicketStatus } from "@prisma/client";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function statusColor(status: string): string {
  switch (status as TicketStatus) {
    case "OPEN":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "PENDING":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "RESOLVED":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function slaBadge(minutes: number | null): { label: string; className: string } | null {
  if (minutes == null) return null;
  if (minutes < 15) return { label: `${minutes}m`, className: "bg-emerald-50 text-emerald-700" };
  if (minutes < 60) return { label: `${minutes}m`, className: "bg-amber-50 text-amber-700" };
  const hours = Math.floor(minutes / 60);
  return { label: `${hours}h+`, className: "bg-rose-50 text-rose-700" };
}
