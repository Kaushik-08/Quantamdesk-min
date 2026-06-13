import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OPEN: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20",
    PENDING: "bg-amber-500/15 text-amber-700 ring-amber-500/20",
    RESOLVED: "bg-slate-500/15 text-slate-600 ring-slate-500/20",
  };
  return (
    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset", styles[status] ?? styles.OPEN)}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    LOW: "text-slate-500",
    NORMAL: "text-blue-600",
    HIGH: "text-orange-600",
    URGENT: "text-rose-600 font-semibold",
  };
  const icons: Record<string, string> = {
    LOW: "○",
    NORMAL: "●",
    HIGH: "▲",
    URGENT: "⚠",
  };
  return (
    <span className={cn("text-xs font-medium", styles[priority] ?? styles.NORMAL)}>
      {icons[priority]} {priority}
    </span>
  );
}

export function TicketRef({ ref_ }: { ref_: string }) {
  return <span className="font-mono text-xs font-semibold text-indigo-600">{ref_}</span>;
}

export function SlaBadge({ minutes }: { minutes: number | null }) {
  if (minutes == null) return <span className="text-xs text-slate-400">—</span>;
  let cls = "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  let label = `${minutes}m`;
  if (minutes >= 60) {
    cls = "bg-rose-50 text-rose-700 ring-rose-600/20";
    label = `${Math.floor(minutes / 60)}h`;
  } else if (minutes >= 15) {
    cls = "bg-amber-50 text-amber-700 ring-amber-600/20";
  }
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", cls)}>
      {label} waiting
    </span>
  );
}

export function LiveIndicator({
  connected = true,
  variant = "light",
}: {
  connected?: boolean;
  variant?: "light" | "dark";
}) {
  const textClass = variant === "dark" ? "text-slate-400" : "text-slate-500";
  const dotClass = connected
    ? variant === "dark"
      ? "bg-emerald-400"
      : "bg-emerald-500"
    : "bg-slate-400";

  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium leading-none", textClass)}>
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass, connected && "animate-pulse-dot")} />
      {connected ? "Live" : "Reconnecting…"}
    </span>
  );
}

export function StatCard({
  label,
  value,
  accent,
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
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold tracking-tight", accent ?? "text-slate-900")}>{value}</p>
      {active && <p className="mt-1 text-xs font-medium text-indigo-600">Active filter · click to clear</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
