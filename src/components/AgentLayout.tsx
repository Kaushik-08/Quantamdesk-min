"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LiveIndicator } from "@/components/ui";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/agent", label: "Inbox", icon: "📥" },
  { href: "/agent?view=mine", label: "My tickets", icon: "👤" },
  { href: "/agent?view=unassigned", label: "Unassigned", icon: "📋" },
];

export function AgentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || user.role !== "AGENT")) {
      router.replace("/login?next=/agent");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">Loading workspace…</p>
      </div>
    );
  }

  if (!user || user.role !== "AGENT") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-[var(--qd-navy)] text-white">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold">
              QD
            </div>
            <div>
              <p className="text-sm font-semibold">QuantumDesk</p>
              <p className="text-xs text-slate-400">Agent Console</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">{user.orgName}</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => {
            const active = pathname === "/agent" && item.href === "/agent" ? pathname === "/agent" : pathname.startsWith(item.href.split("?")[0]) && item.href !== "/agent";
            const isInbox = item.href === "/agent";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                  (isInbox && pathname === "/agent") || active
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <LiveIndicator connected />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-sm font-medium">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="mt-3 w-full rounded-lg bg-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/20"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-slate-200 bg-white px-8 py-4">
          <h1 className="text-lg font-semibold text-slate-900">Support Inbox</h1>
          <p className="text-sm text-slate-500">Manage conversations across {user.orgName}</p>
        </header>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
