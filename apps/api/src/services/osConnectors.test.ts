import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildOsGoogleAuthUrl, OS_PROVIDERS } from "./osConnectors.js";

describe("osConnectors", () => {
  it("exposes personal providers only", () => {
    assert.deepEqual([...OS_PROVIDERS], ["gmail", "google_calendar"]);
  });

  it("builds Google auth URL with Gmail + Calendar read scopes", () => {
    const url = new URL(buildOsGoogleAuthUrl("test-state"));
    assert.equal(url.hostname, "accounts.google.com");
    const scope = url.searchParams.get("scope") ?? "";
    assert.match(scope, /gmail\.readonly/);
    assert.match(scope, /gmail\.send/);
    assert.match(scope, /calendar\.readonly/);
    assert.equal(url.searchParams.get("access_type"), "offline");
    assert.equal(url.searchParams.get("state"), "test-state");
    assert.match(
      url.searchParams.get("redirect_uri") ?? "",
      /\/os\/oauth\/google\/callback$/,
    );
  });
});
