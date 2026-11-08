import { z } from "zod";

export * from "./os.js";
export * from "./modality.js";

export const BusinessStatusSchema = z.enum(["healthy", "attention", "offline"]);
export type BusinessStatus = z.infer<typeof BusinessStatusSchema>;

export const ConnectionProviderSchema = z.enum([
  "instagram",
  "tiktok",
  "google_calendar",
  "cursor_agents",
  "stripe",
  "quickbooks",
]);
export type ConnectionProvider = z.infer<typeof ConnectionProviderSchema>;

export const ConnectionStatusSchema = z.enum([
  "connected",
  "disconnected",
  "optional",
  "error",
]);
export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>;

export const AlertSeveritySchema = z.enum([
  "critical",
  "social",
  "agent",
  "calendar",
  "integration",
]);
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

export const AgentKindSchema = z.enum([
  "ops",
  "growth",
  "finance",
  "cursor_bridge",
]);
export type AgentKind = z.infer<typeof AgentKindSchema>;

export const BusinessSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  status: BusinessStatusSchema,
  metricLabel: z.string(),
  metricValue: z.string(),
  metricDelta: z.number().nullable(),
  timezone: z.string(),
  currency: z.string(),
  revenueToday: z.number(),
  openTasks: z.number(),
});
export type Business = z.infer<typeof BusinessSchema>;

export const ConnectionSchema = z.object({
  id: z.string(),
  businessId: z.string().nullable(),
  provider: ConnectionProviderSchema,
  status: ConnectionStatusSchema,
  label: z.string(),
  detail: z.string().nullable(),
  enabled: z.boolean(),
  comingSoon: z.boolean(),
  lastSyncAt: z.string().nullable(),
});
export type Connection = z.infer<typeof ConnectionSchema>;

export const AlertSchema = z.object({
  id: z.string(),
  businessId: z.string().nullable(),
  businessName: z.string().nullable(),
  severity: AlertSeveritySchema,
  title: z.string(),
  body: z.string().nullable(),
  labels: z.array(z.string()),
  read: z.boolean(),
  createdAt: z.string(),
  impactOrders: z.number().nullable(),
  impactRevenue: z.number().nullable(),
});
export type Alert = z.infer<typeof AlertSchema>;

export const AgentSchema = z.object({
  id: z.string(),
  kind: AgentKindSchema,
  name: z.string(),
  statusLabel: z.string(),
  activity: z.string(),
  connected: z.boolean(),
  updatedAt: z.string(),
});
export type Agent = z.infer<typeof AgentSchema>;

export const SocialPostSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  businessName: z.string(),
  platform: z.enum(["instagram", "tiktok"]),
  title: z.string(),
  caption: z.string(),
  views: z.number(),
  engagementDelta: z.number(),
  durationSec: z.number().nullable(),
  likes: z.number().nullable(),
  comments: z.number().nullable(),
  shares: z.number().nullable(),
  engagementRate: z.number().nullable(),
});
export type SocialPost = z.infer<typeof SocialPostSchema>;

export const CalendarEventSchema = z.object({
  id: z.string(),
  businessId: z.string().nullable(),
  title: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  icon: z.string(),
});
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

export const CommandOverviewSchema = z.object({
  greeting: z.string(),
  systemsLive: z.boolean(),
  revenueToday: z.number(),
  revenueDeltaPct: z.number(),
  openTasks: z.number(),
  mentions: z.number(),
  businesses: z.array(BusinessSchema),
});
export type CommandOverview = z.infer<typeof CommandOverviewSchema>;

export const AgentActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  style: z.enum(["primary", "secondary", "danger"]),
  deeplink: z.string().nullable(),
});
export type AgentAction = z.infer<typeof AgentActionSchema>;

export const AgentMetricSchema = z.object({
  label: z.string(),
  value: z.string(),
  tone: z.enum(["ok", "warn", "bad", "neutral"]),
  hint: z.string().nullable(),
});
export type AgentMetric = z.infer<typeof AgentMetricSchema>;

export const AgentChatRequestSchema = z.object({
  businessId: z.string().optional(),
  conversationId: z.string().optional(),
  message: z.string().min(1),
});
export type AgentChatRequest = z.infer<typeof AgentChatRequestSchema>;

export const AgentChatResponseSchema = z.object({
  conversationId: z.string(),
  messageId: z.string(),
  role: z.literal("assistant"),
  content: z.string(),
  title: z.string().nullable(),
  metrics: z.array(AgentMetricSchema),
  actions: z.array(AgentActionSchema),
  footer: z.string(),
});
export type AgentChatResponse = z.infer<typeof AgentChatResponseSchema>;

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  businessCount: z.number(),
});
export type User = z.infer<typeof UserSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: UserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const CreateBusinessRequestSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  timezone: z.string().default("America/Los_Angeles"),
  currency: z.string().default("USD"),
  connectInstagram: z.boolean().default(false),
  connectTiktok: z.boolean().default(false),
  connectCalendar: z.boolean().default(false),
});
export type CreateBusinessRequest = z.infer<typeof CreateBusinessRequestSchema>;
