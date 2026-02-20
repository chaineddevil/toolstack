"use client";

import { useEffect, useRef } from "react";
import { type UseFormWatch, type UseFormSetValue } from "react-hook-form";

/**
 * Auto-generates a slug from a source field (e.g., title or name).
 * Stops auto-generating once the slug field has been manually edited.
 *
 * @param watch - React Hook Form watch function
 * @param setValue - React Hook Form setValue function
 * @param sourceField - Field name to derive slug from (e.g., "title")
 * @param slugField - Field name for the slug (e.g., "slug")
 * @param hasInitialSlug - Whether the form started with a pre-existing slug
 */
export function useSlugGenerator(
  /* eslint-disable @typescript-eslint/no-explicit-any */
  watch: UseFormWatch<any>,
  setValue: UseFormSetValue<any>,
  sourceField: string,
  slugField: string = "slug",
  hasInitialSlug: boolean = false
) {
  const manuallyEdited = useRef(hasInitialSlug);

  const sourceValue = watch(sourceField);

  useEffect(() => {
    if (manuallyEdited.current || !sourceValue) return;

    const slug = sourceValue
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    setValue(slugField, slug);
  }, [sourceValue, slugField, setValue]);

  return {
    markSlugAsManuallyEdited: () => {
      manuallyEdited.current = true;
    },
    isManuallyEdited: () => manuallyEdited.current,
  };
}
