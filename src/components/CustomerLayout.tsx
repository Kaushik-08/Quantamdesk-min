"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LiveIndicator } from "@/components/ui";

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/customer" className="flex shrink-0 items-center gap-3 transition hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              QD
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">QuantumDesk Support</p>
              <p className="text-xs text-slate-500">{user.orgName}</p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div className="hidden text-right md:block">
              <div className="flex items-center justify-end gap-2">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <LiveIndicator connected variant="light" />
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>
            </div>
            <div className="md:hidden">
              <LiveIndicator connected variant="light" />
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
