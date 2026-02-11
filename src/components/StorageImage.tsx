/**
 * StorageImage — Safe image component with Supabase Storage fallback.
 *
 * Rendering logic:
 *   1. If `storagePath` exists → render Supabase CDN URL via Next.js <Image>
 *   2. Else if `fallbackUrl` exists → render fallback via Next.js <Image>
 *   3. Else → render nothing
 *
 * Uses Next.js <Image> for lazy loading, responsive sizing, and WebP.
 */

import Image from "next/image";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const BUCKET = "public-assets";

function getStoragePublicUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

type StorageImageProps = {
  storagePath?: string | null;
  fallbackUrl?: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
};

export default function StorageImage({
  storagePath,
  fallbackUrl,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes,
  fill = false,
}: StorageImageProps) {
  const src = storagePath
    ? getStoragePublicUrl(storagePath)
    : fallbackUrl ?? null;

  if (!src) return null;

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        priority={priority}
        sizes={sizes ?? "100vw"}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes={sizes}
    />
  );
}
