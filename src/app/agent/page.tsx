import { Suspense } from "react";
import AgentInbox from "./AgentInbox";

export default function AgentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading inbox…</div>}>
      <AgentInbox />
    </Suspense>
  );
}
