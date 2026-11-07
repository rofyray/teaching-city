import { createHash } from "node:crypto";

/** Share link tokens are stored only as SHA-256 hashes (BR-11). */
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
