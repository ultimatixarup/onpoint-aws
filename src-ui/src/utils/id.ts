export function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  const fallback = `${Date.now()}-${Math.random()}`;
  return fallback.replace(/[^a-z0-9-]/gi, "").toLowerCase();
}
