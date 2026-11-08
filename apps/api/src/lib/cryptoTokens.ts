import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "./env.js";

const PREFIX = "enc:v1:";

function keyBytes(): Buffer {
  const raw = env.tokenEncryptionKey || env.jwtSecret;
  return createHash("sha256").update(raw).digest();
}

/** Encrypt OAuth tokens at rest (AES-256-GCM). Pass-through for empty. */
export function encryptSecret(plain: string | null | undefined): string | null {
  if (!plain) return null;
  if (plain.startsWith(PREFIX)) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBytes(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith(PREFIX)) return stored;
  const body = stored.slice(PREFIX.length);
  const [ivB64, tagB64, dataB64] = body.split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Corrupt encrypted token");
  const decipher = createDecipheriv("aes-256-gcm", keyBytes(), Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

export function isEncryptedSecret(stored: string | null | undefined): boolean {
  return Boolean(stored?.startsWith(PREFIX));
}
