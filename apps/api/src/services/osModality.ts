/**
 * Modality router (JV-OS-RP-01 §8 / Thm III functor F approximation).
 */
export type ObjectType =
  | "mail"
  | "chat"
  | "pdf"
  | "form"
  | "calendar"
  | "clip"
  | "voice"
  | "hint"
  | "unknown";

export type RouterInput = {
  source?: string | null;
  app?: string | null;
  title?: string | null;
  url?: string | null;
  hasClipboard?: boolean;
  clipLen?: number;
};

const CHAT_APPS = /messages|slack|discord|whatsapp|telegram|imessage/i;
const PDF_APP = /preview|acrobat|pdf|skim/i;
const MAIL_APP = /mail|gmail|outlook|spark/i;

export function routeModality(input: RouterInput): {
  objectType: ObjectType;
  routerConf: number;
  reason: string;
} {
  if (input.source === "gmail") {
    return { objectType: "mail", routerConf: 0.9, reason: "gmail_connector" };
  }
  if (input.source === "google_calendar") {
    return { objectType: "calendar", routerConf: 0.9, reason: "calendar_connector" };
  }

  const url = input.url ?? "";
  if (/\.pdf(\?|$)/i.test(url) || PDF_APP.test(input.app ?? "")) {
    return { objectType: "pdf", routerConf: 0.75, reason: "pdf_surface" };
  }
  if (CHAT_APPS.test(input.app ?? "") || CHAT_APPS.test(input.title ?? "")) {
    return { objectType: "chat", routerConf: 0.7, reason: "chat_surface" };
  }
  if (MAIL_APP.test(input.app ?? "")) {
    return { objectType: "mail", routerConf: 0.65, reason: "mail_app_ambient" };
  }

  if ((input.clipLen ?? 0) >= 8 || input.hasClipboard) {
    return { objectType: "clip", routerConf: 0.7, reason: "strong_clip" };
  }

  return { objectType: "hint", routerConf: 0.2, reason: "weak_signal" };
}

/** Approve & send allowed only for closable object types. */
export function canApproveExecute(objectType: string | null | undefined): boolean {
  return ["mail", "chat", "pdf", "form", "calendar", "clip", "voice"].includes(
    objectType ?? "",
  );
}
