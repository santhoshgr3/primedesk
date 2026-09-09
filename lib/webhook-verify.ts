import crypto from "crypto";

/**
 * Verify a Meta (WhatsApp Cloud / Lead Ads) webhook payload signature.
 * Header: `X-Hub-Signature-256: sha256=<hmac>`.
 * When `secret` is unset we skip verification (local/dev) and return true.
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string | undefined,
): boolean {
  if (!secret) return true; // no secret configured -> dev mode
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const provided = signatureHeader.slice("sha256=".length);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(provided, "hex"),
    );
  } catch {
    return false;
  }
}
