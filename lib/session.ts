import "server-only";

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const PASSWORD_KEY_LENGTH = 64;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, originalHash] = storedHash.split(":");
  if (!salt || !originalHash) return false;

  const derivedHash = scryptSync(password, salt, PASSWORD_KEY_LENGTH);
  const originalBuffer = Buffer.from(originalHash, "hex");

  if (derivedHash.length !== originalBuffer.length) return false;

  return timingSafeEqual(derivedHash, originalBuffer);
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
