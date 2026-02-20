/**
 * Storage Service — Supabase Storage abstraction layer.
 *
 * All Supabase Storage interactions go through this service.
 * Never access Supabase storage directly from controllers/routes.
 *
 * Bucket: public-assets (public, CDN-enabled)
 * Upload restricted via service role key.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { validateUrlForFetch } from "@/lib/security/ssrf-guard";

const BUCKET = "public-assets";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_PREFIXES = ["image/"];

// ─── Magic Byte Validation ───────────────────────────────────────────────────
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39], // GIF89a
  ],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP container)
  "image/svg+xml": [[0x3c]], // '<' — SVG starts with XML tag
  "image/avif": [], // AVIF uses ISOBMFF — skip magic byte check
  "image/bmp": [[0x42, 0x4d]], // BM
  "image/tiff": [
    [0x49, 0x49, 0x2a, 0x00], // Little-endian
    [0x4d, 0x4d, 0x00, 0x2a], // Big-endian
  ],
};

function validateMagicBytes(buffer: Buffer, contentType: string): boolean {
  const mimeBase = contentType.split(";")[0].trim().toLowerCase();
  const signatures = MAGIC_BYTES[mimeBase];

  // If we don't have signatures for this type, allow it (e.g., avif)
  if (!signatures || signatures.length === 0) return true;

  return signatures.some((sig) =>
    sig.every((byte, i) => buffer[i] === byte)
  );
}

// ─── MIME to Extension Mapping ───────────────────────────────────────────────
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
};

/**
 * Get file extension from MIME type (not from filename).
 */
export function getExtFromMime(contentType: string): string {
  const mimeBase = contentType.split(";")[0].trim().toLowerCase();
  return MIME_TO_EXT[mimeBase] ?? "bin";
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Upload an image from a remote URL to Supabase Storage.
 *
 * 1. Validates URL for SSRF
 * 2. Fetches the image
 * 3. Validates MIME type (image/*)
 * 4. Validates magic bytes
 * 5. Validates size (≤ 10 MB)
 * 6. Uploads to bucket under `targetPath`
 *
 * @param imageUrl  The external URL to download
 * @param targetPath  e.g. "tools/abc123.webp"
 * @returns The storage path on success
 * @throws On validation failure, network error, or upload error
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  targetPath: string
): Promise<string> {
  // 0. SSRF protection — validate URL before fetching
  await validateUrlForFetch(imageUrl);

  // 1. Download
  const res = await fetch(imageUrl, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch image: ${res.status} ${res.statusText} — ${imageUrl}`
    );
  }

  // 2. Validate MIME
  const contentType = res.headers.get("content-type") ?? "";
  const isImage = ALLOWED_MIME_PREFIXES.some((prefix) =>
    contentType.startsWith(prefix)
  );
  if (!isImage) {
    throw new Error(
      `Invalid content-type "${contentType}" for ${imageUrl}. Expected image/*`
    );
  }

  // 3. Read buffer & validate size
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `Image too large: ${(buffer.length / 1024 / 1024).toFixed(1)} MB exceeds 10 MB limit — ${imageUrl}`
    );
  }

  // 4. Validate magic bytes match claimed MIME type
  if (!validateMagicBytes(buffer, contentType)) {
    throw new Error(
      `Magic bytes do not match content-type "${contentType}" — possible file type mismatch for ${imageUrl}`
    );
  }

  // 5. Upload (upsert so re-runs are safe)
  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).upload(targetPath, buffer, {
    contentType: contentType.split(";")[0].trim(),
    upsert: true,
  });

  if (error) {
    throw new Error(`Storage upload failed for "${targetPath}": ${error.message}`);
  }

  return targetPath;
}

/**
 * Upload a raw buffer to Supabase Storage.
 * Validates MIME type via magic bytes before uploading.
 */
export async function uploadBuffer(
  buf: Buffer,
  targetPath: string,
  contentType = "image/webp"
): Promise<string> {
  if (buf.length > MAX_FILE_SIZE) {
    throw new Error(
      `Buffer too large: ${(buf.length / 1024 / 1024).toFixed(1)} MB exceeds 10 MB limit`
    );
  }

  // Validate magic bytes
  if (!validateMagicBytes(buf, contentType)) {
    throw new Error(
      `Magic bytes do not match content-type "${contentType}" — upload rejected`
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).upload(targetPath, buf, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Storage upload failed for "${targetPath}": ${error.message}`);
  }

  return targetPath;
}

/**
 * Get the public CDN URL for a storage path.
 *
 * @param path  e.g. "tools/abc123.webp"
 * @returns Full public URL
 */
export function getPublicUrl(path: string): string {
  const admin = createAdminClient();
  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete an asset from Supabase Storage.
 *
 * @param path  e.g. "tools/abc123.webp"
 */
export async function deleteAsset(path: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).remove([path]);
  if (error) {
    throw new Error(`Storage delete failed for "${path}": ${error.message}`);
  }
}

/**
 * Ensure the public-assets bucket exists.
 * Called once during migration; idempotent.
 */
export async function ensureBucket(): Promise<void> {
  const admin = createAdminClient();

  // Check if bucket exists
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);

  if (!exists) {
    const { error } = await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
    });
    if (error && !error.message.includes("already exists")) {
      throw new Error(`Failed to create bucket "${BUCKET}": ${error.message}`);
    }
  }

  console.log(`[storage] Bucket "${BUCKET}" ready`);
}
