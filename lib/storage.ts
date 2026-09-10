import fs from "node:fs/promises";
import path from "node:path";

/**
 * Local-disk object storage for deal documents. Swap for S3/R2 in production
 * (set R2_* env and reimplement save/read) — the call sites only use these two
 * functions plus the returned key.
 */
const ROOT = path.join(process.cwd(), "uploads");

async function ensureDir() {
  await fs.mkdir(ROOT, { recursive: true });
}

export async function saveUpload(key: string, data: Buffer): Promise<void> {
  await ensureDir();
  // key must be a bare id — reject path traversal.
  if (!/^[A-Za-z0-9_-]+$/.test(key)) throw new Error("bad key");
  await fs.writeFile(path.join(ROOT, key), data);
}

export async function readUpload(key: string): Promise<Buffer | null> {
  if (!/^[A-Za-z0-9_-]+$/.test(key)) return null;
  try {
    return await fs.readFile(path.join(ROOT, key));
  } catch {
    return null;
  }
}

export async function deleteUpload(key: string): Promise<void> {
  if (!/^[A-Za-z0-9_-]+$/.test(key)) return;
  await fs.rm(path.join(ROOT, key), { force: true });
}

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
};

export function mimeFromName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return MIME[ext] ?? "application/octet-stream";
}
