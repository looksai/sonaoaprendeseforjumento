// Anonymizes a user identifier via SHA-256(userId + APP_SALT).
// Never send the raw user_id — only user_hash is persisted in `events`.

const APP_SALT =
  (import.meta.env.VITE_APP_SALT as string | undefined) ??
  "lastcourse-default-salt-v1";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Deterministic anonymous hash for an authenticated user.
 * For anonymous/guests, we generate a random per-device id stored locally.
 */
export async function getUserHash(userId: string | null | undefined): Promise<string> {
  const id = userId ?? getOrCreateAnonId();
  return sha256Hex(`${id}:${APP_SALT}`);
}

function getOrCreateAnonId(): string {
  if (typeof window === "undefined") return "anon";
  const KEY = "lc_anon_id";
  let v = localStorage.getItem(KEY);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(KEY, v);
  }
  return v;
}
