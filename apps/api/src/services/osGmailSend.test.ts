import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  base64UrlEncode,
  buildPlainReplyMime,
  encodeMimeSubject,
  parseReplyToAddress,
  replySubject,
} from "./osGmailSend.js";
import { scopesIncludeGmailSend } from "./osConnectors.js";

describe("osGmailSend helpers", () => {
  it("parses angle-addr and bare email", () => {
    assert.equal(parseReplyToAddress("Alex <alex@acme.com>"), "alex@acme.com");
    assert.equal(parseReplyToAddress("bob@example.org"), "bob@example.org");
    assert.equal(parseReplyToAddress(null), null);
  });

  it("prefixes Re: once", () => {
    assert.equal(replySubject("Hello"), "Re: Hello");
    assert.equal(replySubject("Re: Hello"), "Re: Hello");
  });

  it("encodes non-ASCII subjects", () => {
    const enc = encodeMimeSubject("need your reply — close");
    assert.match(enc, /^=\?UTF-8\?B\?/);
    const raw = buildPlainReplyMime({
      to: "a@b.com",
      subject: "need your reply — close in Work",
      body: "Hi",
    });
    assert.match(raw, /^Subject: =\?UTF-8\?B\?/m);
  });

  it("builds MIME with In-Reply-To", () => {
    const raw = buildPlainReplyMime({
      to: "a@b.com",
      subject: "Re: Test",
      body: "Hi",
      inReplyTo: "<msg@test>",
    });
    assert.match(raw, /To: a@b.com/);
    assert.match(raw, /In-Reply-To: <msg@test>/);
  });

  it("base64url encodes without padding", () => {
    const enc = base64UrlEncode("hello");
    assert.ok(!enc.includes("="));
    assert.ok(!enc.includes("+"));
  });
});

describe("Gmail send scope", () => {
  it("detects gmail.send in scope string", () => {
    assert.equal(
      scopesIncludeGmailSend(
        "openid email https://www.googleapis.com/auth/gmail.send",
      ),
      true,
    );
    assert.equal(scopesIncludeGmailSend("gmail.readonly calendar.readonly"), false);
  });
});
