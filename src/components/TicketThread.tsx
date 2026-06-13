"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MessageItem } from "@/types";
import { useRealtime } from "@/hooks/useRealtime";
import { formatRelativeTime } from "@/lib/utils";

type TicketThreadProps = {
  ticketId: string;
  initialMessages: MessageItem[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
  currentUserId: string;
};

export function TicketThread({
  ticketId,
  initialMessages,
  initialNextCursor,
  initialHasMore,
  currentUserId,
}: TicketThreadProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  useRealtime(ticketId, {
    onMessage: (data) => {
      if (data.ticketId !== ticketId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        if (prev.some((m) => m.id.startsWith("optimistic-"))) {
          return prev
            .filter((m) => !m.id.startsWith("optimistic-"))
            .concat(data.message);
        }
        return [...prev, data.message];
      });
    },
  });

  const loadOlder = async () => {
    if (!hasMore || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    const res = await fetch(
      `/api/tickets/${ticketId}?cursor=${encodeURIComponent(nextCursor)}`
    );
    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...data.messages, ...prev]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    }
    setLoadingMore(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: MessageItem = {
      id: optimisticId,
      ticketId,
      authorId: currentUserId,
      authorName: "You",
      authorRole: "LOCAL",
      body: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setBody("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to send message");
      }

      const data = await res.json();
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimisticId);
        if (withoutOptimistic.some((m) => m.id === data.message.id)) {
          return withoutOptimistic;
        }
        return [...withoutOptimistic, data.message];
      });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setBody(trimmed);
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {hasMore && (
        <button
          onClick={loadOlder}
          disabled={loadingMore}
          className="self-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          {loadingMore ? "Loading…" : "Load older messages"}
        </button>
      )}

      <div className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4">
        {messages.map((message) => {
          const isMine = message.authorId === currentUserId;
          const isOptimistic = message.id.startsWith("optimistic-");

          return (
            <div
              key={message.id}
              className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
            >
              <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium">{message.authorName}</span>
                <span>{formatRelativeTime(message.createdAt)}</span>
                {isOptimistic && <span className="text-indigo-500">Sending…</span>}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  isMine
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-800"
                } ${isOptimistic ? "opacity-70" : ""}`}
              >
                {message.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex flex-col gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Write a message…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="self-end rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  );
}
