/**
 * Resolve secrets from process env first, then AWS Secrets Manager.
 * Never logs secret values.
 */
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const cache = new Map<string, { at: number; value: Record<string, string> }>();
const TTL_MS = 5 * 60_000;

let client: SecretsManagerClient | null = null;

function smClient() {
  if (!client) {
    client = new SecretsManagerClient({
      region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
    });
  }
  return client;
}

export async function getJsonSecret(
  secretId: string,
): Promise<Record<string, string> | null> {
  const hit = cache.get(secretId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  try {
    const out = await smClient().send(
      new GetSecretValueCommand({ SecretId: secretId }),
    );
    const raw = out.SecretString;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, string>;
    cache.set(secretId, { at: Date.now(), value: parsed });
    return parsed;
  } catch (err) {
    const name = err instanceof Error ? err.name : "Error";
    // Missing credentials / no secret in local dogfood — quiet.
    if (
      name === "CredentialsProviderError" ||
      name === "ResourceNotFoundException" ||
      name === "AccessDeniedException"
    ) {
      return null;
    }
    console.error(`secrets: failed to load ${secretId} (${name})`);
    return null;
  }
}

export async function resolveEnvOrSecret(
  envKey: string,
  secretId: string,
  secretField: string,
): Promise<string | null> {
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv) return fromEnv;
  const json = await getJsonSecret(secretId);
  const v = json?.[secretField]?.trim();
  return v || null;
}
