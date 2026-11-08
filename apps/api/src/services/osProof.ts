import { prisma } from "../db/client.js";
import { OsCloseError } from "./osClose.js";
import {
  getValidOsAccessToken,
  syncOsGmail,
  userHasGmailSendScope,
} from "./osConnectors.js";
import { extractLoopsFromSync } from "./osLoops.js";
import { sendGmailNewMessage } from "./osGmailSend.js";

const P01_SUBJECT = "[Juvantage P0.1] need your reply — close in Work";

/**
 * Sends a real message from the user's Gmail to their own inbox so extract can
 * surface a mail loop. Does not bypass Approve — user still Draft → Approve.
 */
export async function seedP01MailTest(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) throw new OsCloseError("User email missing", 400);

  const gmail = await getValidOsAccessToken(userId, "gmail");
  if (!gmail || gmail.mode !== "oauth") {
    throw new OsCloseError(
      "Real Google Gmail required — Connect → Connect Google (not Demo), then try again.",
      403,
    );
  }
  if (!(await userHasGmailSendScope(userId))) {
    throw new OsCloseError(
      "Gmail send scope missing — Connect → Connect Google again to grant send.",
      403,
    );
  }

  const body = [
    "This is a Juvantage OS P0.1 test thread.",
    "",
    "Please reply to close this loop in Work (Mail).",
    "Need your reply when you can — thanks.",
    "",
    `(Sent ${new Date().toISOString()})`,
  ].join("\n");

  let sent;
  try {
    sent = await sendGmailNewMessage({
      accessToken: gmail.token,
      to: user.email,
      subject: P01_SUBJECT,
      body,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/401|UNAUTHENTICATED/i.test(msg)) {
      throw new OsCloseError(
        "Gmail session expired — Connect → Connect Google, then run P0.1 seed again.",
        401,
      );
    }
    throw new OsCloseError(`Could not send test mail: ${msg}`, 502);
  }

  await syncOsGmail(userId);
  const extracted = await extractLoopsFromSync(userId);

  return {
    ok: true,
    to: user.email,
    subject: P01_SUBJECT,
    messageId: sent.messageId,
    threadId: sent.threadId,
    extractedCount: extracted.createdCount,
    steps: [
      "Check Gmail Inbox for the test message (from you).",
      "Work → Source: Mail → select [Juvantage P0.1] thread.",
      "Draft → edit → Approve & send.",
      "Confirm a reply in Gmail Sent.",
      "Log Day 1 in docs/DOGFOOD_JOURNAL.md",
    ],
  };
}
