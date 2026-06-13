"use client";

import { useState } from "react";

type AiResponse = {
  action: string;
  source: "openai" | "demo";
  bullets?: Array<{ label: string; text: string }>;
  message?: string;
};

type CustomerAiHelperProps = {
  ticketId: string;
};

export function CustomerAiHelper({ ticketId }: CustomerAiHelperProps) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: "customer-insight" | "summarize") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 shadow-sm">
      <div className="flex items-center gap-3 border-b border-violet-100 bg-white/50 px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md">
          <span className="text-sm">✦</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">QuantumDesk Assistant</p>
          <p className="text-xs text-slate-500">Track your ticket · Get instant updates</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex gap-2">
          <button
            onClick={() => run("customer-insight")}
            disabled={loading}
            className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-medium text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-50 disabled:opacity-50"
          >
            {loading ? "…" : "📍 What's happening?"}
          </button>
          <button
            onClick={() => run("summarize")}
            disabled={loading}
            className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-medium text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-50 disabled:opacity-50"
          >
            {loading ? "…" : "✦ Summarize"}
          </button>
        </div>

        {loading && (
          <div className="flex items-start gap-2 rounded-lg bg-white/80 p-3">
            <div className="h-6 w-6 animate-pulse rounded-full bg-violet-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2 w-full animate-pulse rounded bg-violet-100" />
              <div className="h-2 w-4/5 animate-pulse rounded bg-violet-50" />
            </div>
          </div>
        )}

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}

        {!loading && response?.message && (
          <div className="flex gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500 text-[10px] text-white">✦</div>
            <p className="rounded-lg rounded-tl-none bg-white px-3 py-2 text-xs leading-relaxed text-slate-700 shadow-sm">
              {response.message}
            </p>
          </div>
        )}

        {!loading && response?.bullets && (
          <div className="space-y-2">
            {response.bullets.map((b, i) => (
              <div key={i} className="rounded-lg bg-white/90 px-3 py-2 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600">{b.label}</p>
                <p className="mt-0.5 text-xs text-slate-700">{b.text}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && !response && !error && (
          <p className="text-center text-[11px] text-slate-400">
            Ask the assistant about your ticket status
          </p>
        )}
      </div>
    </div>
  );
}
