/**
 * Phase 3 — Backfill Migration Script
 *
 * Downloads external images (Unsplash, Wikimedia, etc.), converts to WebP
 * via sharp, uploads to Supabase Storage, and saves the storage path
 * in the new *_path columns.
 *
 * Usage:
 *   npx tsx src/scripts/migrate_external_images.ts            # live run
 *   npx tsx src/scripts/migrate_external_images.ts --dry-run  # preview only
 *
 * Features:
 *   - Idempotent (skips rows already migrated)
 *   - Fails gracefully per-record (does not abort batch)
 *   - Logs progress to stdout
 *   - Validates MIME type before upload
 *   - Converts to WebP, max 1600px wide, quality 80
 *   - Deterministic paths: {entityType}/{slug}-{field}.webp
 */

import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "public-assets";
const MAX_WIDTH = 1600;
const WEBP_QUALITY = 80;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const DRY_RUN = process.argv.includes("--dry-run");

// ─── Supabase Admin Client ──────────────────────────────────────────────────

function getAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function downloadAndConvert(url: string): Promise<Buffer> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Not an image: ${contentType} — ${url}`);
  }

  const raw = Buffer.from(await res.arrayBuffer());
  if (raw.length > MAX_FILE_SIZE) {
    throw new Error(
      `Source too large: ${(raw.length / 1024 / 1024).toFixed(1)} MB — ${url}`
    );
  }

  // Convert to WebP with constrained width
  const webp = await sharp(raw)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  return webp;
}

async function uploadToStorage(
  admin: ReturnType<typeof getAdmin>,
  path: string,
  buf: Buffer
): Promise<void> {
  const { error } = await admin.storage.from(BUCKET).upload(path, buf, {
    contentType: "image/webp",
    upsert: true,
  });
  if (error) {
    throw new Error(`Upload failed for "${path}": ${error.message}`);
  }
}

function storagePath(entityType: string, slug: string, field: string): string {
  return `${entityType}/${slug}-${field}.webp`;
}

// ─── Ensure Bucket ──────────────────────────────────────────────────────────

async function ensureBucket(admin: ReturnType<typeof getAdmin>) {
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
    });
    if (error && !error.message.includes("already exists")) {
      throw new Error(`Failed to create bucket: ${error.message}`);
    }
    console.log(`[bucket] Created "${BUCKET}"`);
  } else {
    console.log(`[bucket] "${BUCKET}" already exists`);
  }
}

// ─── Migrate Tools ──────────────────────────────────────────────────────────

async function migrateTools(admin: ReturnType<typeof getAdmin>) {
  const { data: tools, error } = await admin
    .from("tools")
    .select("id, slug, image_url, logo_url, image_path, logo_path");

  if (error) throw new Error(`Failed to query tools: ${error.message}`);
  if (!tools || tools.length === 0) {
    console.log("[tools] No tools found.");
    return;
  }

  console.log(`\n[tools] Processing ${tools.length} tools...\n`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const tool of tools) {
    // ── image_url → image_path ──
    if (tool.image_url && !tool.image_path) {
      const path = storagePath("tools", tool.slug, "image");
      if (DRY_RUN) {
        console.log(`  [dry-run] Would migrate tool #${tool.id} (${tool.slug}) image_url → ${path}`);
      } else {
        try {
          console.log(`  [tool #${tool.id}] Downloading image: ${tool.image_url.substring(0, 80)}...`);
          const buf = await downloadAndConvert(tool.image_url);
          console.log(`  [tool #${tool.id}] Uploading ${(buf.length / 1024).toFixed(0)} KB → ${path}`);
          await uploadToStorage(admin, path, buf);

          await admin
            .from("tools")
            .update({ image_path: path })
            .eq("id", tool.id);

          console.log(`  [tool #${tool.id}] ✓ image_path saved`);
          migrated++;
        } catch (err) {
          console.error(`  [tool #${tool.id}] ✗ image failed: ${(err as Error).message}`);
          failed++;
        }
      }
    } else {
      skipped++;
    }

    // ── logo_url → logo_path ──
    if (tool.logo_url && !tool.logo_path) {
      const path = storagePath("tools", tool.slug, "logo");
      if (DRY_RUN) {
        console.log(`  [dry-run] Would migrate tool #${tool.id} (${tool.slug}) logo_url → ${path}`);
      } else {
        try {
          console.log(`  [tool #${tool.id}] Downloading logo: ${tool.logo_url.substring(0, 80)}...`);
          const buf = await downloadAndConvert(tool.logo_url);
          console.log(`  [tool #${tool.id}] Uploading ${(buf.length / 1024).toFixed(0)} KB → ${path}`);
          await uploadToStorage(admin, path, buf);

          await admin
            .from("tools")
            .update({ logo_path: path })
            .eq("id", tool.id);

          console.log(`  [tool #${tool.id}] ✓ logo_path saved`);
          migrated++;
        } catch (err) {
          console.error(`  [tool #${tool.id}] ✗ logo failed: ${(err as Error).message}`);
          failed++;
        }
      }
    }
  }

  console.log(`\n[tools] Done — migrated: ${migrated}, skipped: ${skipped}, failed: ${failed}`);
}

// ─── Migrate Posts ──────────────────────────────────────────────────────────

async function migratePosts(admin: ReturnType<typeof getAdmin>) {
  const { data: posts, error } = await admin
    .from("posts")
    .select("id, slug, featured_image, featured_image_path");

  if (error) throw new Error(`Failed to query posts: ${error.message}`);
  if (!posts || posts.length === 0) {
    console.log("[posts] No posts found.");
    return;
  }

  console.log(`\n[posts] Processing ${posts.length} posts...\n`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const post of posts) {
    if (post.featured_image && !post.featured_image_path) {
      const path = storagePath("posts", post.slug, "featured");
      if (DRY_RUN) {
        console.log(`  [dry-run] Would migrate post #${post.id} (${post.slug}) featured_image → ${path}`);
      } else {
        try {
          console.log(`  [post #${post.id}] Downloading: ${post.featured_image.substring(0, 80)}...`);
          const buf = await downloadAndConvert(post.featured_image);
          console.log(`  [post #${post.id}] Uploading ${(buf.length / 1024).toFixed(0)} KB → ${path}`);
          await uploadToStorage(admin, path, buf);

          await admin
            .from("posts")
            .update({ featured_image_path: path })
            .eq("id", post.id);

          console.log(`  [post #${post.id}] ✓ featured_image_path saved`);
          migrated++;
        } catch (err) {
          console.error(`  [post #${post.id}] ✗ failed: ${(err as Error).message}`);
          failed++;
        }
      }
    } else {
      skipped++;
    }
  }

  console.log(`\n[posts] Done — migrated: ${migrated}, skipped: ${skipped}, failed: ${failed}`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  ToolStack — Image Migration to Supabase Storage");
  console.log(`  Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE"}`);
  console.log("═══════════════════════════════════════════════════════\n");

  const admin = getAdmin();

  // Ensure bucket
  await ensureBucket(admin);

  // Migrate
  await migrateTools(admin);
  await migratePosts(admin);

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  Migration complete.");
  console.log("═══════════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
