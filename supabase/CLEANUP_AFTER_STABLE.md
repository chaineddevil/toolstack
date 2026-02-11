# Phase 6 — Cleanup (After 1–2 Weeks Stable)

> DO NOT execute these steps until the migration has been running in production
> for at least 1–2 weeks with zero broken images.

## Prerequisites

- [ ] All migrated images confirmed working on production
- [ ] No user reports of broken images
- [ ] Analytics show no 404s on image routes

## Steps

### 1. Remove fallback logic in `StorageImage` component

In `src/components/StorageImage.tsx`, remove the `fallbackUrl` prop and
only resolve from `storagePath`. Remove the ternary fallback.

### 2. Remove fallback logic in `QuizClient`

In `src/app/quiz/QuizClient.tsx`, remove the `resolveImageSrc` function's
fallback to `fallbackUrl` and the `image_url` references.

### 3. Remove fallback logic in `AdminProducts`

In `src/app/admin/products/page.tsx`, remove `resolveImageSrc` fallback.

### 4. Drop legacy URL columns from database

Run this SQL in the Supabase Dashboard SQL Editor:

```sql
ALTER TABLE tools DROP COLUMN IF EXISTS image_url;
ALTER TABLE tools DROP COLUMN IF EXISTS logo_url;
ALTER TABLE posts DROP COLUMN IF EXISTS featured_image;
```

### 5. Remove legacy domains from `next.config.ts`

Remove the Unsplash and Wikimedia entries from `images.remotePatterns`:

```ts
// REMOVE these entries:
{ protocol: "https", hostname: "images.unsplash.com" },
{ protocol: "https", hostname: "upload.wikimedia.org" },
```

### 6. Remove legacy types from `db.ts`

Remove `image_url`, `logo_url` from the `Tool` type and `featured_image`
from the `Post` type.

### 7. Remove migration script

Delete `src/scripts/migrate_external_images.ts` — no longer needed.

### 8. Remove migration SQL files

Delete `supabase/add_image_path_columns.sql` — already applied.

### 9. Verify and deploy

Run `npm run build` to confirm no type errors, then deploy.
