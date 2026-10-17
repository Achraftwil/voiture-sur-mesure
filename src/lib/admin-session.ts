import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "demande_session";

export function adminCookieName() {
  return COOKIE;
}

export function adminSessionToken() {
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update("demandes").digest("base64url");
}

export function isAdminSession(value: string | undefined) {
  const expected = adminSessionToken();
  if (!value || !expected) return false;
  const left = createHash("sha256").update(value).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function passwordMatches(password: string) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!password || !expected) return false;
  const left = createHash("sha256").update(password).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}
