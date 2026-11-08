import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { LoginRequestSchema } from "@juvantage/shared";
import { prisma } from "../db/client.js";
import { signToken } from "../lib/auth.js";
import type { AppVariables } from "../middleware/auth.js";

export const authRoutes = new Hono<{ Variables: AppVariables }>();

authRoutes.post("/login", async (c) => {
  const body = LoginRequestSchema.parse(await c.req.json());
  const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    return c.json({ error: "Invalid email or password" }, 401);
  }
  const businessCount = await prisma.business.count({
    where: {
      organization: { memberships: { some: { userId: user.id } } },
    },
  });
  const token = await signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
  return c.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      businessCount,
    },
  });
});

authRoutes.get("/me", async (c) => {
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer ")) return c.json({ error: "Unauthorized" }, 401);
  const { verifyToken } = await import("../lib/auth.js");
  try {
    const payload = await verifyToken(auth.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const businessCount = await prisma.business.count({
      where: {
        organization: { memberships: { some: { userId: user.id } } },
      },
    });
    return c.json({
      id: user.id,
      name: user.name,
      email: user.email,
      businessCount,
    });
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
});
