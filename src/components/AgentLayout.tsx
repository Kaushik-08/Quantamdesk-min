"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LiveIndicator } from "@/components/ui";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/agent", label: "Inbox", match: "inbox" as const },
  { href: "/agent?view=mine", label: "My tickets", match: "mine" as const },
  { href: "/agent?view=unassigned", label: "Unassigned", match: "unassigned" as const },
];

function AgentLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  const view = searchParams.get("view");
  const hasFilter = Boolean(searchParams.get("status") || searchParams.get("sla"));

  useEffect(() => {
    if (!loading && (!user || user.role !== "AGENT")) {
      router.replace("/login?next=/agent");
    }
  }, [loading, user, router]);

  const isActive = (match: "inbox" | "mine" | "unassigned") => {
    if (pathname !== "/agent") return false;
    if (match === "inbox") return !view && !hasFilter;
    if (match === "mine") return view === "mine";
    return view === "unassigned";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Loading workspace…</p>
      </div>
    );
  }

  if (!user || user.role !== "AGENT") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="sticky top-0 flex h-screen w-[17rem] shrink-0 flex-col bg-[var(--qd-navy)] text-white">
        <div className="border-b border-white/10 px-6 py-6">
          <Link
            href="/agent"
            className="flex w-full items-center gap-3 rounded-lg transition hover:bg-white/5"
            title="All tickets"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold">
              QD
            </div>
            <div>
              <p className="text-sm font-semibold">QuantumDesk</p>
              <p className="text-xs text-slate-400">Agent Console</p>
            </div>
          </Link>
          <p className="mt-4 text-xs text-slate-400">{user.orgName}</p>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition",
                isActive(item.match)
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/80 text-sm font-medium">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <LiveIndicator connected variant="dark" />
              </div>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="mt-4 w-full rounded-lg bg-white/10 px-3 py-2.5 text-xs text-slate-300 transition hover:bg-white/20"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-slate-200 bg-white px-8 py-5">
          <h1 className="text-lg font-semibold text-slate-900">Support Inbox</h1>
          <p className="mt-0.5 text-sm text-slate-600">Manage conversations across {user.orgName}</p>
        </header>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}

export function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="text-slate-600">Loading…</p>
        </div>
      }
    >
      <AgentLayoutInner>{children}</AgentLayoutInner>
    </Suspense>
  );
}
