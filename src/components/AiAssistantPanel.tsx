"use client";

import { useState } from "react";
import type { AiBullet } from "@/lib/ai";

type AiResponse = {
  action: "summarize" | "suggest-reply";
  source: "openai" | "demo";
  bullets?: AiBullet[];
  message?: string;
};

type AiAssistantPanelProps = {
  ticketId: string;
  onUseReply?: (text: string) => void;
};

export function AiAssistantPanel({ ticketId, onUseReply }: AiAssistantPanelProps) {
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<"summarize" | "suggest-reply" | null>(null);
  const [response, setResponse] = useState<AiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAi = async (action: "summarize" | "suggest-reply") => {
    setLoading(true);
    setActiveAction(action);
    setError(null);

    try {
      const res = await fetch(`/api/tickets/${ticketId}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI request failed");
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-b from-indigo-50/80 to-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-indigo-100 bg-white/60 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm">
          ✦
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">QuantumDesk AI</p>
          <p className="text-xs text-slate-500">Summarize threads · Suggest replies</p>
        </div>
        {response && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
              response.source === "openai"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {response.source === "openai" ? "GPT" : "Demo"}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3">
        <button
          onClick={() => runAi("summarize")}
          disabled={loading}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition ${
            activeAction === "summarize" && loading
              ? "bg-indigo-600 text-white"
              : "bg-white text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50"
          }`}
        >
          {loading && activeAction === "summarize" ? "Summarizing…" : "✦ Summarize"}
        </button>
        <button
          onClick={() => runAi("suggest-reply")}
          disabled={loading}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition ${
            activeAction === "suggest-reply" && loading
              ? "bg-indigo-600 text-white"
              : "bg-white text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50"
          }`}
        >
          {loading && activeAction === "suggest-reply" ? "Thinking…" : "✎ Suggest reply"}
        </button>
      </div>

      {/* Output */}
      <div className="px-4 pb-4">
        {loading && (
          <div className="flex items-start gap-3 rounded-lg bg-white p-3 ring-1 ring-indigo-100">
            <div className="flex h-7 w-7 shrink-0 animate-pulse items-center justify-center rounded-full bg-indigo-100 text-xs">
              ✦
            </div>
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-2 w-3/4 animate-pulse rounded bg-indigo-100" />
              <div className="h-2 w-full animate-pulse rounded bg-indigo-50" />
              <div className="h-2 w-5/6 animate-pulse rounded bg-indigo-50" />
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
        )}

        {!loading && response?.action === "summarize" && response.bullets && (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
                ✦
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {response.bullets.map((bullet, i) => (
                  <div key={i} className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
                      {bullet.label}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-700">{bullet.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && response?.action === "suggest-reply" && response.message && (
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
              ✦
            </div>
            <div className="min-w-0 flex-1">
              <div className="rounded-lg rounded-tl-none bg-white px-3 py-3 ring-1 ring-slate-100">
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                  {response.message}
                </p>
              </div>
              {onUseReply && (
                <button
                  onClick={() => onUseReply(response.message!)}
                  className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Use this reply →
                </button>
              )}
            </div>
          </div>
        )}

        {!loading && !response && !error && (
          <p className="text-center text-xs text-slate-400 py-2">
            Ask AI to summarize the thread or draft a reply
          </p>
        )}

        {response?.source === "demo" && !loading && (
          <p className="mt-3 text-center text-[10px] text-slate-400">
            Demo intelligence — add OpenAI billing for live GPT output
          </p>
        )}
      </div>
    </div>
  );
}
