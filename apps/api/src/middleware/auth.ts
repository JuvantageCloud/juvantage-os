import type { Context, Next } from "hono";
import { verifyToken, type JwtPayload } from "../lib/auth.js";

export type AppVariables = {
  user: JwtPayload;
};

export async function requireAuth(c: Context<{ Variables: AppVariables }>, next: Next) {
  const header = c.req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  try {
    const user = await verifyToken(header.slice(7));
    c.set("user", user);
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
}
