/**
 * Object storage stub (Cloudflare R2 / S3-compatible).
 * Used for shortlist PDFs, space images, and deal documents.
 */
export async function uploadFile(
  _key: string,
  _body: Buffer | Uint8Array,
  _contentType: string,
): Promise<{ url: string }> {
  if (!process.env.R2_ACCOUNT_ID) {
    return { url: `https://placehold.co/local/${encodeURIComponent(_key)}` };
  }
  // TODO(phase-2): PutObject to R2 bucket, return public URL.
  throw new Error("R2 upload not implemented yet");
}
