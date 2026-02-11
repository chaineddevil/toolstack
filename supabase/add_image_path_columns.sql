-- ============================================================
-- Phase 2: Add image_path columns (NON-BREAKING)
--
-- Adds nullable path columns alongside existing URL columns.
-- Existing URLs remain intact. New columns store Supabase
-- Storage paths (e.g. "tools/abc123.webp").
--
-- Safe to run multiple times (IF NOT EXISTS / idempotent).
-- ============================================================

-- ── tools table ──────────────────────────────────────────────

ALTER TABLE tools ADD COLUMN IF NOT EXISTS image_path TEXT;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS logo_path TEXT;

COMMENT ON COLUMN tools.image_path IS 'Supabase Storage path for hero image (replaces image_url)';
COMMENT ON COLUMN tools.logo_path  IS 'Supabase Storage path for logo (replaces logo_url)';

-- ── posts table ──────────────────────────────────────────────

ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured_image_path TEXT;

COMMENT ON COLUMN posts.featured_image_path IS 'Supabase Storage path for featured image (replaces featured_image)';
