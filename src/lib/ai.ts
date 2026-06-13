type TicketMessage = {
  body: string;
  author: { name: string; role: string };
};

type TicketContext = {
  title: string;
  status: string;
  messages: TicketMessage[];
};

export type AiBullet = {
  label: string;
  text: string;
};

export type AiResult = {
  source: "openai" | "demo";
  action: "summarize" | "suggest-reply" | "customer-insight";
  bullets?: AiBullet[];
  message?: string;
};

function lastMessageByRole(messages: TicketMessage[], role: string): TicketMessage | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].author.role === role) return messages[i];
  }
  return null;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

function nextStep(ticket: TicketContext): string {
  if (ticket.status === "RESOLVED") {
    return "No action needed — ticket is resolved.";
  }
  const last = ticket.messages.at(-1);
  if (!last) return "Review the ticket and send an initial response.";
  if (last.author.role === "CUSTOMER") {
    return "Customer is waiting — send a follow-up reply.";
  }
  if (ticket.status === "PENDING") {
    return "Waiting on internal update — check back with the customer soon.";
  }
  return "Monitor for customer response.";
}

export function generateDemoSummary(ticket: TicketContext): AiResult {
  const customer = ticket.messages.find((m) => m.author.role === "CUSTOMER");
  const lastAgent = lastMessageByRole(ticket.messages, "AGENT");

  return {
    source: "demo",
    action: "summarize",
    bullets: [
      { label: "Issue", text: ticket.title },
      { label: "Status", text: `${ticket.status} · ${ticket.messages.length} messages` },
      {
        label: "Customer said",
        text: customer ? truncate(customer.body, 120) : "No customer message yet",
      },
      {
        label: "Latest agent reply",
        text: lastAgent
          ? `${lastAgent.author.name}: "${truncate(lastAgent.body, 100)}"`
          : "No agent reply yet",
      },
      { label: "Recommended next step", text: nextStep(ticket) },
    ],
  };
}

export function generateCustomerSummary(ticket: TicketContext): AiResult {
  const last = ticket.messages.at(-1);
  return {
    source: "demo",
    action: "summarize",
    bullets: [
      { label: "Your request", text: ticket.title },
      { label: "Status", text: ticket.status },
      { label: "Messages", text: `${ticket.messages.length} in this conversation` },
      {
        label: "Latest update",
        text: last
          ? `${last.author.name}: "${truncate(last.body, 100)}"`
          : "Waiting for first response",
      },
    ],
  };
}

export function generateCustomerInsight(ticket: TicketContext): AiResult {
  const last = ticket.messages.at(-1);
  const agent = ticket.messages.find((m) => m.author.role === "AGENT");

  let statusMessage: string;
  if (ticket.status === "RESOLVED") {
    statusMessage = "Your ticket has been resolved. If you need more help, send another message and we'll reopen it.";
  } else if (ticket.status === "PENDING") {
    statusMessage = agent
      ? `${agent.author.name} is working on your request. We're waiting on an internal update and will get back to you soon.`
      : "Your ticket is being reviewed by our team. We'll update you shortly.";
  } else if (last?.author.role === "AGENT") {
    statusMessage = `${last.author.name} replied recently. Take a look at their message and let us know if you need anything else.`;
  } else {
    statusMessage = "Your ticket is in our queue. An agent will respond shortly — you'll see their reply here in real time.";
  }

  return {
    source: "demo",
    action: "customer-insight",
    message: statusMessage,
  };
}

export function generateDemoReply(ticket: TicketContext): AiResult {
  const lastCustomer = lastMessageByRole(ticket.messages, "CUSTOMER");
  const firstName = lastCustomer?.author.name?.split(" ")[0] ?? "there";

  let message: string;

  if (ticket.status === "RESOLVED") {
    message = `Hi ${firstName},

Thanks for confirming — glad we could get this sorted. I've marked the ticket as resolved, but feel free to reply if anything else comes up.

Best regards,
Support Team`;
  } else if (ticket.status === "PENDING") {
    message = `Hi ${firstName},

Thank you for your patience on this. We're still working through the internal steps for "${ticket.title}" and I'll update you as soon as I have news.

Best regards,
Support Team`;
  } else {
    const snippet = lastCustomer ? truncate(lastCustomer.body, 80) : ticket.title;
    message = `Hi ${firstName},

Thanks for reaching out about "${ticket.title}". I've reviewed your note: "${snippet}"

I'm looking into this now and will follow up shortly. Let me know if anything has changed on your end.

Best regards,
Support Team`;
  }

  return { source: "demo", action: "suggest-reply", message };
}

function parseOpenAiSummary(text: string): AiBullet[] {
  const lines = text.split("\n").filter((l) => l.trim());
  return lines.map((line) => {
    const cleaned = line.replace(/^[-•*]\s*/, "").trim();
    const colon = cleaned.indexOf(":");
    if (colon > 0 && colon < 40) {
      return { label: cleaned.slice(0, colon).replace(/\*\*/g, "").trim(), text: cleaned.slice(colon + 1).trim() };
    }
    return { label: "Note", text: cleaned.replace(/\*\*/g, "") };
  });
}

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: "You are a concise helpdesk assistant. Keep responses under 120 words.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`OpenAI error: ${response.status} ${text}`) as Error & {
      status?: number;
      isQuotaError?: boolean;
    };
    err.status = response.status;
    err.isQuotaError =
      response.status === 429 ||
      text.includes("insufficient_quota") ||
      text.includes("billing");
    throw err;
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() ?? "No response generated.";
}

function buildPrompt(ticket: TicketContext, action: "summarize" | "suggest-reply"): string {
  const thread = ticket.messages
    .map((m) => `[${m.author.role}] ${m.author.name}: ${m.body}`)
    .join("\n");

  return action === "suggest-reply"
    ? `Suggest a professional support reply for this ticket.\nTitle: ${ticket.title}\nStatus: ${ticket.status}\nThread:\n${thread}`
    : `Summarize this support ticket in 3-5 bullet points.\nTitle: ${ticket.title}\nStatus: ${ticket.status}\nThread:\n${thread}`;
}

function openAiToResult(action: "summarize" | "suggest-reply", text: string): AiResult {
  if (action === "summarize") {
    return { source: "openai", action, bullets: parseOpenAiSummary(text) };
  }
  return { source: "openai", action, message: text };
}

export async function runAiAssist(
  ticket: TicketContext,
  action: "summarize" | "suggest-reply" | "customer-insight",
  options?: { forCustomer?: boolean }
): Promise<AiResult> {
  const mode = process.env.AI_MODE ?? "auto";

  if (action === "customer-insight") {
    return generateCustomerInsight(ticket);
  }

  if (options?.forCustomer && action === "summarize") {
    if (mode === "demo" || !process.env.OPENAI_API_KEY) {
      return generateCustomerSummary(ticket);
    }
  }

  if (mode === "demo") {
    if (action === "summarize") {
      return options?.forCustomer ? generateCustomerSummary(ticket) : generateDemoSummary(ticket);
    }
    return generateDemoReply(ticket);
  }

  if (mode === "openai" || (mode === "auto" && process.env.OPENAI_API_KEY)) {
    try {
      const text = await callOpenAI(buildPrompt(ticket, action));
      return openAiToResult(action, text);
    } catch (error) {
      const isQuota =
        error instanceof Error &&
        "isQuotaError" in error &&
        (error as { isQuotaError?: boolean }).isQuotaError;

      if (mode === "auto" && isQuota) {
        if (action === "summarize") {
          return options?.forCustomer ? generateCustomerSummary(ticket) : generateDemoSummary(ticket);
        }
        return generateDemoReply(ticket);
      }
      throw error;
    }
  }

  if (action === "summarize") {
    return options?.forCustomer ? generateCustomerSummary(ticket) : generateDemoSummary(ticket);
  }
  return generateDemoReply(ticket);
}
