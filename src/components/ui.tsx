import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OPEN: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    PENDING: "bg-slate-100 text-slate-700 ring-slate-200",
    RESOLVED: "bg-slate-50 text-slate-500 ring-slate-200",
  };
  return (
    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset", styles[status] ?? styles.OPEN)}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    LOW: "text-slate-400",
    NORMAL: "text-slate-600",
    HIGH: "text-slate-800 font-medium",
    URGENT: "text-indigo-700 font-semibold",
  };
  return (
    <span className={cn("text-xs", styles[priority] ?? styles.NORMAL)}>
      {priority}
    </span>
  );
}

export function TicketRef({ ref_ }: { ref_: string }) {
  return <span className="font-mono text-xs font-semibold text-indigo-600">{ref_}</span>;
}

export function SlaBadge({ minutes }: { minutes: number | null }) {
  if (minutes == null) return <span className="text-xs text-slate-400">—</span>;
  const urgent = minutes >= 60;
  const warn = minutes >= 15;
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        urgent
          ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
          : warn
            ? "bg-slate-100 text-slate-700 ring-slate-200"
            : "bg-slate-50 text-slate-500 ring-slate-200"
      )}
    >
      {minutes >= 60 ? `${Math.floor(minutes / 60)}h` : `${minutes}m`} waiting
    </span>
  );
}

export function LiveIndicator({ connected = true }: { connected?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          connected ? "bg-indigo-400 animate-pulse-dot" : "bg-slate-500"
        )}
      />
      {connected ? "Live" : "Reconnecting…"}
    </span>
  );
}

export function StatCard({
  label,
  value,
  href,
  active,
}: {
  label: string;
  value: number;
  accent?: string;
  href?: string;
  active?: boolean;
}) {
  const clickable = Boolean(href);
  const inner = (
    <div
      className={cn(
        "rounded-xl border bg-white p-5 shadow-sm transition",
        clickable && "cursor-pointer hover:border-indigo-300 hover:shadow-md",
        active ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-200"
      )}
    >
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      {active && <p className="mt-1 text-xs font-medium text-indigo-600">Active filter · click to clear</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
