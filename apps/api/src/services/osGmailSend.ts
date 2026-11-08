/** Gmail reply send (users.messages.send) — used after approve + grant consume. */

export function parseReplyToAddress(fromAddr: string | null | undefined): string | null {
  if (!fromAddr) return null;
  const angle = fromAddr.match(/<([^>]+)>/);
  if (angle?.[1]) return angle[1].trim();
  const trimmed = fromAddr.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return trimmed;
  return null;
}

export function replySubject(base: string): string {
  const t = base.trim();
  if (/^re:/i.test(t)) return t;
  return `Re: ${t}`;
}

/** RFC 2047 encode for non-ASCII subjects (avoids â€" mojibake in Gmail). */
export function encodeMimeSubject(subject: string): string {
  const trimmed = subject.trim();
  if (/^[\x20-\x7E]*$/.test(trimmed)) return trimmed;
  const b64 = Buffer.from(trimmed, "utf8").toString("base64");
  return `=?UTF-8?B?${b64}?=`;
}

/** RFC 822 raw message, CRLF line endings. */
export function buildPlainReplyMime(input: {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string | null;
  references?: string | null;
}): string {
  const lines = [
    `To: ${input.to}`,
    `Subject: ${encodeMimeSubject(input.subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
  ];
  if (input.inReplyTo) {
    lines.push(`In-Reply-To: ${input.inReplyTo}`);
  }
  if (input.references) {
    lines.push(`References: ${input.references}`);
  }
  lines.push("", input.body.replace(/\r?\n/g, "\r\n"));
  return lines.join("\r\n");
}

export function base64UrlEncode(raw: string): string {
  return Buffer.from(raw, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function headerValue(
  headers: Array<{ name: string; value: string }>,
  name: string,
): string | null {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? null;
}

async function gmailFetch(accessToken: string, path: string) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Gmail API ${path}: ${await res.text()}`);
  }
  return res.json() as Promise<unknown>;
}

/** New thread (no threadId) — used for P0.1 self-test seed. */
export async function sendGmailNewMessage(input: {
  accessToken: string;
  to: string;
  subject: string;
  body: string;
}): Promise<{ messageId: string; threadId: string }> {
  const raw = buildPlainReplyMime({
    to: input.to,
    subject: input.subject,
    body: input.body,
  });

  const sendRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: base64UrlEncode(raw) }),
    },
  );

  if (!sendRes.ok) {
    throw new Error(`Gmail send failed: ${await sendRes.text()}`);
  }

  const sent = (await sendRes.json()) as { id?: string; threadId?: string };
  if (!sent.id || !sent.threadId) {
    throw new Error("Gmail send returned no message/thread id");
  }

  return { messageId: sent.id, threadId: sent.threadId };
}

export async function sendGmailReply(input: {
  accessToken: string;
  threadId: string;
  to: string;
  subject: string;
  body: string;
}): Promise<{ messageId: string; threadId: string }> {
  const thread = (await gmailFetch(
    input.accessToken,
    `/threads/${encodeURIComponent(input.threadId)}?format=metadata&metadataHeaders=Message-ID&metadataHeaders=Subject`,
  )) as {
    id?: string;
    messages?: Array<{
      payload?: { headers?: Array<{ name: string; value: string }> };
    }>;
  };

  const last = thread.messages?.[thread.messages.length - 1];
  const headers = last?.payload?.headers ?? [];
  const subject = replySubject(
    headerValue(headers, "Subject") ?? input.subject,
  );
  const inReplyTo = headerValue(headers, "Message-ID");

  const raw = buildPlainReplyMime({
    to: input.to,
    subject,
    body: input.body,
    inReplyTo,
    references: inReplyTo,
  });

  const sendRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: base64UrlEncode(raw),
        threadId: input.threadId,
      }),
    },
  );

  if (!sendRes.ok) {
    throw new Error(`Gmail send failed: ${await sendRes.text()}`);
  }

  const sent = (await sendRes.json()) as { id?: string; threadId?: string };
  if (!sent.id) {
    throw new Error("Gmail send returned no message id");
  }

  return {
    messageId: sent.id,
    threadId: sent.threadId ?? input.threadId,
  };
}
