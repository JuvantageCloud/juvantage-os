import { SignJWT, jwtVerify } from "jose";
import { env } from "./env.js";

const secret = new TextEncoder().encode(env.jwtSecret);

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
};

export async function signToken(payload: JwtPayload) {
  return new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret);
  return {
    sub: String(payload.sub),
    email: String(payload.email),
    name: String(payload.name),
  };
}
