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

const BUCKET = "public-assets";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_PREFIXES = ["image/"];

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Upload an image from a remote URL to Supabase Storage.
 *
 * 1. Fetches the image
 * 2. Validates MIME type (image/*)
 * 3. Validates size (≤ 5 MB)
 * 4. Uploads to bucket under `targetPath`
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
      `Image too large: ${(buffer.length / 1024 / 1024).toFixed(1)} MB exceeds 5 MB limit — ${imageUrl}`
    );
  }

  // 4. Upload (upsert so re-runs are safe)
  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).upload(targetPath, buffer, {
    contentType: "image/webp",
    upsert: true,
  });

  if (error) {
    throw new Error(`Storage upload failed for "${targetPath}": ${error.message}`);
  }

  return targetPath;
}

/**
 * Upload a raw buffer to Supabase Storage.
 */
export async function uploadBuffer(
  buf: Buffer,
  targetPath: string,
  contentType = "image/webp"
): Promise<string> {
  if (buf.length > MAX_FILE_SIZE) {
    throw new Error(
      `Buffer too large: ${(buf.length / 1024 / 1024).toFixed(1)} MB exceeds 5 MB limit`
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
