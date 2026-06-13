"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LiveIndicator } from "@/components/ui";
import { cn } from "@/lib/utils";

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || user.role !== "CUSTOMER")) {
      router.replace("/login?next=/customer");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  if (!user || user.role !== "CUSTOMER") {
    return null;
  }

  const onTickets = pathname === "/customer";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-4">
          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-3 rounded-lg text-left transition hover:opacity-80"
            title="Switch account"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              QD
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">QuantumDesk Support</p>
              <p className="text-xs text-slate-500">{user.orgName}</p>
            </div>
          </button>

          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/customer"
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition",
                onTickets ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              My tickets
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <LiveIndicator connected />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <button
              onClick={() => logout()}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
