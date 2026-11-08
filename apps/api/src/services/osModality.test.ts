import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canApproveExecute, routeModality } from "./osModality.js";

describe("osModality router", () => {
  it("routes gmail source to mail", () => {
    const r = routeModality({ source: "gmail" });
    assert.equal(r.objectType, "mail");
  });

  it("routes pdf url", () => {
    const r = routeModality({ url: "https://x/lease.pdf" });
    assert.equal(r.objectType, "pdf");
  });

  it("routes Messages app to chat", () => {
    const r = routeModality({ app: "Messages" });
    assert.equal(r.objectType, "chat");
  });

  it("weak signal → hint", () => {
    const r = routeModality({ app: "Norton", clipLen: 0 });
    assert.equal(r.objectType, "hint");
    assert.ok(r.routerConf < 0.5);
  });

  it("approve gate by object type", () => {
    assert.equal(canApproveExecute("mail"), true);
    assert.equal(canApproveExecute("hint"), false);
    assert.equal(canApproveExecute("unknown"), false);
  });
});
