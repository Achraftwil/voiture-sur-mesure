import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "client_session";

export function clientCookieName() {
  return COOKIE;
}

export function normaliserEmail(email: string) {
  return email.trim().toLowerCase();
}

export function clientSessionValue(email: string) {
  const secret = process.env.DEMANDE_READ_SECRET;
  const adresse = normaliserEmail(email);
  if (!secret || !adresse) return "";
  const mac = createHmac("sha256", secret).update(`client:${adresse}`).digest("base64url");
  return `${Buffer.from(adresse).toString("base64url")}.${mac}`;
}

export function emailFromClientSession(value: string | undefined) {
  if (!value) return "";
  const point = value.lastIndexOf(".");
  if (point <= 0) return "";
  let email = "";
  try {
    email = Buffer.from(value.slice(0, point), "base64url").toString("utf8");
  } catch {
    return "";
  }
  const expected = clientSessionValue(email);
  if (!expected) return "";
  const left = createHash("sha256").update(value).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right) ? normaliserEmail(email) : "";
}

export function clientCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
