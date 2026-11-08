import Anthropic from "@anthropic-ai/sdk";
import type { AgentAction, AgentChatResponse, AgentMetric } from "@juvantage/shared";
import { prisma } from "../db/client.js";
import { env, hasLiveLlm } from "../lib/env.js";
import { agentToolDefinitions, runAgentTool, getBusinessSummary, listAlerts, getSocialMetrics, getCalendarEvents } from "./tools.js";

const SYSTEM = `You are the Ops Agent for Juvantage Business OS — a calm command center for business owners.
Answer clearly with concrete numbers from tools. Prefer short paragraphs.
When something needs attention, explain why and recommend 1-3 actions.
Never invent metrics; call tools. Never claim you changed production systems; propose actions that require confirmation.
If asked about Cursor/coding agents, say Cursor Bridge is connected as a stub in V1 and can investigate later with approval.`;

function money(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

async function demoAgentReply(
  userId: string,
  message: string,
  businessId?: string,
): Promise<Omit<AgentChatResponse, "conversationId" | "messageId" | "role" | "footer">> {
  const summary = await getBusinessSummary(userId, businessId);
  const alerts = await listAlerts(userId, businessId);
  const social = await getSocialMetrics(userId, businessId);
  const calendar = await getCalendarEvents(userId, businessId);
  const lower = message.toLowerCase();

  const critical = alerts.find((a) => a.severity === "critical");

  if (
    lower.includes("harbor") ||
    lower.includes("attention") ||
    lower.includes("inventory") ||
    lower.includes("why")
  ) {
    const metrics: AgentMetric[] = [
      {
        label: "Lag",
        value: "2.6K units",
        tone: "bad",
        hint: "Above threshold",
      },
      {
        label: "Threshold",
        value: "2K units",
        tone: "neutral",
        hint: "Set by Harbor Retail",
      },
      {
        label: "Last sync",
        value: "18 min ago",
        tone: "warn",
        hint: "Stale",
      },
    ];
    const actions: AgentAction[] = [
      {
        id: "open_inventory",
        label: "Open inventory",
        style: "secondary",
        deeplink: critical ? `juvantage://alerts/${critical.id}` : "juvantage://alerts",
      },
      {
        id: "notify_team",
        label: "Notify team",
        style: "secondary",
        deeplink: null,
      },
      {
        id: "escalate",
        label: "Escalate",
        style: "secondary",
        deeplink: null,
      },
    ];
    return {
      title: "Inventory sync lag on TikTok Shop",
      content:
        "SKU H-204 is showing a **2.6K unit lag** between your system and TikTok Shop.\n\n**Why it flagged:** Harbor Retail’s threshold is 2K units. Continued lag risks fulfillment delays and sales rank.\n\n**Recommended action:** Review and resync inventory to avoid stockouts.",
      metrics,
      actions,
    };
  }

  if (lower.includes("post") || lower.includes("content") || lower.includes("reel")) {
    const top = social[0];
    return {
      title: "Content performance",
      content: top
        ? `Your strongest post is **${top.platform}** for ${top.businessName}: ${top.views.toLocaleString()} views (${top.engagementDelta > 0 ? "+" : ""}${top.engagementDelta}% engagement).\n\nI can draft three hooks based on what’s working — say the word and I’ll propose copy for approval.`
        : "I don’t see social posts yet. Connect Instagram to unlock content insights.",
      metrics: top
        ? [
            {
              label: "Views",
              value: `${(top.views / 1000).toFixed(1)}k`,
              tone: "ok",
              hint: top.platform,
            },
            {
              label: "Engagement",
              value: `${top.engagementDelta > 0 ? "+" : ""}${top.engagementDelta}%`,
              tone: "ok",
              hint: null,
            },
          ]
        : [],
      actions: [
        {
          id: "ask_growth",
          label: "Ask Growth Agent for next hooks",
          style: "primary",
          deeplink: "juvantage://agents/growth",
        },
      ],
    };
  }

  const attentionNames = summary.attentionBusinesses.map((b) => b.name).join(", ");
  const nextEvent = calendar[0];
  const content = [
    `Revenue across ${summary.businessCount} businesses is **${money(summary.revenueToday)}** today with **${summary.openTasks}** open tasks.`,
    attentionNames
      ? `**Needs attention:** ${attentionNames}. ${critical?.title ?? "Open Alerts for details."}`
      : "All businesses look healthy right now.",
    nextEvent
      ? `Next on the calendar: **${nextEvent.title}** at ${new Date(nextEvent.startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`
      : null,
    social[0]
      ? `Social highlight: ${social[0].businessName} ${social[0].platform} post at ${(social[0].views / 1000).toFixed(1)}k views.`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    title: "Business health today",
    content,
    metrics: [
      {
        label: "Revenue",
        value: money(summary.revenueToday),
        tone: "ok",
        hint: "Today",
      },
      {
        label: "Open tasks",
        value: String(summary.openTasks),
        tone: summary.openTasks > 3 ? "warn" : "ok",
        hint: summary.openTasks > 0 ? "Needs attention" : "Clear",
      },
      {
        label: "Alerts",
        value: String(alerts.length),
        tone: critical ? "bad" : "neutral",
        hint: critical ? "Critical open" : null,
      },
    ],
    actions: critical
      ? [
          {
            id: "investigate",
            label: "Investigate",
            style: "primary",
            deeplink: `juvantage://alerts/${critical.id}`,
          },
        ]
      : [
          {
            id: "view_alerts",
            label: "View alerts",
            style: "secondary",
            deeplink: "juvantage://alerts",
          },
        ],
  };
}

async function liveAgentReply(
  userId: string,
  message: string,
  businessId?: string,
): Promise<Omit<AgentChatResponse, "conversationId" | "messageId" | "role" | "footer">> {
  const client = new Anthropic({ apiKey: env.anthropicApiKey });
  const tools = agentToolDefinitions.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as Anthropic.Tool.InputSchema,
  }));

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: businessId
        ? `Business context id: ${businessId}\n\nUser: ${message}`
        : message,
    },
  ];

  let response = await client.messages.create({
    model: env.llmModel,
    max_tokens: 1200,
    system: SYSTEM,
    tools,
    messages,
  });

  for (let i = 0; i < 5; i++) {
    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    if (toolUses.length === 0) break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const use of toolUses) {
      const input = (use.input ?? {}) as { businessId?: string };
      if (!input.businessId && businessId) input.businessId = businessId;
      const result = await runAgentTool(use.name, userId, input);
      toolResults.push({
        type: "tool_result",
        tool_use_id: use.id,
        content: JSON.stringify(result),
      });
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });

    response = await client.messages.create({
      model: env.llmModel,
      max_tokens: 1200,
      system: SYSTEM,
      tools,
      messages,
    });
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const fallback = await demoAgentReply(userId, message, businessId);
  return {
    title: fallback.title,
    content: text || fallback.content,
    metrics: fallback.metrics,
    actions: fallback.actions,
  };
}

export async function chatWithOpsAgent(params: {
  userId: string;
  message: string;
  businessId?: string;
  conversationId?: string;
}): Promise<AgentChatResponse> {
  let conversationId = params.conversationId;
  if (conversationId) {
    const existing = await prisma.agentConversation.findFirst({
      where: { id: conversationId, userId: params.userId },
    });
    if (!existing) conversationId = undefined;
  }

  if (!conversationId) {
    const created = await prisma.agentConversation.create({
      data: {
        userId: params.userId,
        businessId: params.businessId,
        agentKind: "ops",
      },
    });
    conversationId = created.id;
  }

  await prisma.agentMessage.create({
    data: {
      conversationId,
      role: "user",
      content: params.message,
    },
  });

  const reply =
    hasLiveLlm() && env.llmProvider === "anthropic"
      ? await liveAgentReply(params.userId, params.message, params.businessId)
      : await demoAgentReply(params.userId, params.message, params.businessId);

  const saved = await prisma.agentMessage.create({
    data: {
      conversationId,
      role: "assistant",
      content: reply.content,
      title: reply.title,
      metricsJson: JSON.stringify(reply.metrics),
      actionsJson: JSON.stringify(reply.actions),
    },
  });

  await prisma.agentRun.create({
    data: {
      conversationId,
      status: "completed",
      toolCallsJson: JSON.stringify(["getBusinessSummary", "listAlerts"]),
      requiresConfirm: false,
    },
  });

  return {
    conversationId,
    messageId: saved.id,
    role: "assistant",
    content: reply.content,
    title: reply.title,
    metrics: reply.metrics,
    actions: reply.actions,
    footer: "Powered by Cursor Bridge • Secure • Contextual • Actionable",
  };
}
