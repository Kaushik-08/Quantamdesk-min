"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const DEMO_ACCOUNTS = {
  agents: [
    { email: "alex.chen@quantumdesk.io", name: "Alex Chen", role: "Agent" },
    { email: "priya.sharma@quantumdesk.io", name: "Priya Sharma", role: "Agent" },
    { email: "marcus.johnson@quantumdesk.io", name: "Marcus Johnson", role: "Agent" },
  ],
  customers: [
    { email: "sam.ortiz@acmecorp.com", name: "Sam Ortiz", role: "Customer" },
    { email: "jordan.lee@acmecorp.com", name: "Jordan Lee", role: "Customer" },
    { email: "taylor.nguyen@acmecorp.com", name: "Taylor Nguyen", role: "Customer" },
  ],
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [demoConfigured, setDemoConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/demo-login")
      .then((res) => res.json())
      .then((data) => setDemoConfigured(Boolean(data.configured)))
      .catch(() => setDemoConfigured(false));
  }, []);

  const redirectAfterLogin = (role: "AGENT" | "CUSTOMER") => {
    const next = searchParams.get("next");
    if (next && next.startsWith("/")) {
      router.push(next);
    } else if (role === "AGENT") {
      router.push("/agent");
    } else {
      router.push("/customer");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      redirectAfterLogin(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (accountEmail: string) => {
    setDemoLoading(accountEmail);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: accountEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Demo login failed");
      }
      redirectAfterLogin(data.user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setDemoLoading(null);
    }
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
            Real-time support,
            <br />
            built for teams.
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
          <p className="mt-2 text-sm text-slate-500">Welcome back. Sign in to your workspace.</p>

          {demoConfigured === false && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-medium">Local setup required</p>
              <p className="mt-1 text-amber-800">
                Add <code className="rounded bg-amber-100 px-1 font-mono text-xs">DEMO_PASSWORD=your-password</code> to
                your <code className="rounded bg-amber-100 px-1 font-mono text-xs">.env</code> file, then restart{" "}
                <code className="rounded bg-amber-100 px-1 font-mono text-xs">npm run dev</code>.
              </p>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="you@company.com"
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
                placeholder="Enter your password"
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

          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">Try the demo</p>
            <p className="mt-1 text-xs text-slate-500">
              One-click sign-in for reviewers. Requires local setup (see README).
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">Agents</p>
                <div className="space-y-2">
                  {DEMO_ACCOUNTS.agents.map((a) => (
                    <button
                      key={a.email}
                      type="button"
                      disabled={Boolean(demoLoading)}
                      onClick={() => handleDemoLogin(a.email)}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
                    >
                      <span className="font-medium text-slate-800">{a.name}</span>
                      <span className="text-xs text-slate-400">
                        {demoLoading === a.email ? "…" : "→"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">Customers</p>
                <div className="space-y-2">
                  {DEMO_ACCOUNTS.customers.map((c) => (
                    <button
                      key={c.email}
                      type="button"
                      disabled={Boolean(demoLoading)}
                      onClick={() => handleDemoLogin(c.email)}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
                    >
                      <span className="font-medium text-slate-800">{c.name}</span>
                      <span className="text-xs text-slate-400">
                        {demoLoading === c.email ? "…" : "→"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
