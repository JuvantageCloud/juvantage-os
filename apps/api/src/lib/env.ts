import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });
config({ path: resolve(__dirname, "../../../../.env") });

export const env = {
  port: Number(process.env.PORT ?? 3001),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  demoMode: (process.env.DEMO_MODE ?? "true") === "true",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  llmProvider: (process.env.LLM_PROVIDER ?? "anthropic") as "anthropic" | "openai",
  llmModel: process.env.LLM_MODEL ?? "claude-sonnet-4-20250514",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3001/oauth/google/callback",
  /** Personal OS OAuth callback (Phase 2). Add this URI in Google Cloud Console. */
  googleOsRedirectUri:
    process.env.GOOGLE_OS_REDIRECT_URI ??
    "http://localhost:3001/os/oauth/google/callback",
  tokenEncryptionKey:
    process.env.TOKEN_ENCRYPTION_KEY ?? process.env.JWT_SECRET ?? "dev-token-key",
  metaAppId: process.env.META_APP_ID ?? "",
  metaAppSecret: process.env.META_APP_SECRET ?? "",
  metaRedirectUri:
    process.env.META_REDIRECT_URI ?? "http://localhost:3001/oauth/instagram/callback",
};

export function hasLiveLlm() {
  if (env.llmProvider === "openai") return Boolean(env.openaiApiKey);
  return Boolean(env.anthropicApiKey);
}
