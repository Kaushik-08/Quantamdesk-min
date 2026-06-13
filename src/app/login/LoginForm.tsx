"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const DEMO_PASSWORD = "demo123";

const DEMO_ACCOUNTS = {
  agents: [
    { email: "alex.chen@quantumdesk.io", name: "Alex Chen" },
    { email: "priya.sharma@quantumdesk.io", name: "Priya Sharma" },
    { email: "marcus.johnson@quantumdesk.io", name: "Marcus Johnson" },
  ],
  customers: [
    { email: "sam.ortiz@acmecorp.com", name: "Sam Ortiz" },
    { email: "jordan.lee@acmecorp.com", name: "Jordan Lee" },
    { email: "taylor.nguyen@acmecorp.com", name: "Taylor Nguyen" },
  ],
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      const next = searchParams.get("next");
      if (next && next.startsWith("/")) {
        router.push(next);
      } else if (user.role === "AGENT") {
        router.push("/agent");
      } else {
        router.push("/customer");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword(DEMO_PASSWORD);
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-[var(--qd-navy)] p-12 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-lg font-bold">
              QD
            </div>
            <span className="text-xl font-semibold">QuantumDesk</span>
          </div>
          <h1 className="mt-16 text-4xl font-bold leading-tight">
            Real-time support,<br />built for teams.
          </h1>
          <p className="mt-4 max-w-md text-slate-400">
            A minimal slice of the QuantumDesk platform — tickets, live conversations,
            agent inbox, SLA tracking, and audit trails.
          </p>
        </div>
        <div className="space-y-4 text-sm text-slate-400">
          <p>✓ Live message threads with SSE</p>
          <p>✓ Agent assignment &amp; status workflow</p>
          <p>✓ Multi-customer org with realistic seed data</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
          <p className="mt-2 text-sm text-slate-500">
            Demo password for all accounts:{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-indigo-600">demo123</code>
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="alex.chen@quantumdesk.io"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quick access — Agents</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.agents.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => quickLogin(a.email)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quick access — Customers</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.customers.map((c) => (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => quickLogin(c.email)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
