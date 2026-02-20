"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toolSchema, type ToolFormData } from "@/lib/schemas/tool";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CollapsibleSection from "./CollapsibleSection";
import DynamicListEditor from "./DynamicListEditor";
import ImageUploadField from "./ImageUploadField";
import CharCounter from "./CharCounter";

interface ToolEditFormProps {
  initialData?: ToolFormData;
  categories?: Array<{ id: number; name: string; slug: string }>;
}

export default function ToolEditForm({
  initialData,
  categories = [],
}: ToolEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    !!initialData?.slug
  );

  const form = useForm<ToolFormData>({
    resolver: zodResolver(toolSchema),
    defaultValues: initialData || {
      name: "",
      slug: "",
      tagline: "",
      description: "",
      what_it_is: "",
      who_its_for: "",
      pricing_summary: "",
      website_url: "",
      affiliate_url: "",
      image_url: "",
      category_slug: "",
      status: "draft",
      is_indexed: true,
      pros: [],
      cons: [],
      use_cases: [],
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = form;

  // Auto-generate slug from name
  const nameValue = watch("name");
  useEffect(() => {
    if (!slugManuallyEdited && nameValue) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", slug);
    }
  }, [nameValue, slugManuallyEdited, setValue]);

  async function onSubmit(data: ToolFormData) {
    setSaving(true);
    try {
      const url = initialData?.id
        ? `/api/products/${initialData.id}`
        : "/api/products";
      const method = initialData?.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to save");

      router.refresh();
      router.push("/admin/tools");
    } catch {
      alert("Error saving tool");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-5xl">
      {/* ─── Section 1: Basic Info (Always Open) ──────────────────────── */}
      <section className="bg-white p-6 rounded-xl border border-black/5 space-y-4">
        <h3 className="font-semibold text-lg">Basic Info</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              {...register("name")}
              className="w-full p-2 border rounded-lg"
              placeholder="Tool name"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">
                {errors.name.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input
              {...register("slug")}
              className="w-full p-2 border rounded-lg"
              onChange={(e) => {
                setSlugManuallyEdited(true);
                register("slug").onChange(e);
              }}
            />
            {errors.slug && (
              <p className="text-red-500 text-xs mt-1">
                {errors.slug.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tagline</label>
          <input
            {...register("tagline")}
            className="w-full p-2 border rounded-lg"
            placeholder="Short catchy tagline"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            {...register("description")}
            rows={4}
            className="w-full p-2 border rounded-lg"
            placeholder="Full description of the tool..."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              {...register("category_slug")}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Rating (0-5)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="5"
              {...register("rating", { valueAsNumber: true })}
              className="w-full p-2 border rounded-lg"
              placeholder="e.g., 4.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              {...register("status")}
              className="w-full p-2 border rounded-lg"
            >
              <option value="draft">Draft</option>
              <option value="needs_review">Needs Review</option>
              <option value="approved">Approved</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </section>

      {/* ─── Section 2: Details (Collapsible) ──────────────────────────── */}
      <CollapsibleSection title="Details">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              What It Is
            </label>
            <textarea
              {...register("what_it_is")}
              rows={3}
              className="w-full p-2 border rounded-lg"
              placeholder="Describe what this tool does..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Who It&apos;s For
            </label>
            <textarea
              {...register("who_its_for")}
              rows={3}
              className="w-full p-2 border rounded-lg"
              placeholder="Target audience, e.g., freelancers, startups..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Pricing Summary
            </label>
            <input
              {...register("pricing_summary")}
              className="w-full p-2 border rounded-lg"
              placeholder="e.g., Free plan available, Pro starts at $12/mo"
            />
          </div>

          <DynamicListEditor
            control={control}
            name="pros"
            label="Pros"
            placeholder="Add a pro..."
          />

          <DynamicListEditor
            control={control}
            name="cons"
            label="Cons"
            placeholder="Add a con..."
          />

          <DynamicListEditor
            control={control}
            name="use_cases"
            label="Use Cases"
            placeholder="Add a use case..."
          />
        </div>
      </CollapsibleSection>

      {/* ─── Section 3: URLs & Media (Collapsible) ─────────────────────── */}
      <CollapsibleSection title="URLs & Media">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                Website URL
              </label>
              <input
                {...register("website_url")}
                className="w-full p-2 border rounded-lg"
                placeholder="https://..."
              />
              {errors.website_url && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.website_url.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Affiliate URL
              </label>
              <input
                {...register("affiliate_url")}
                className="w-full p-2 border rounded-lg"
                placeholder="https://..."
              />
              {errors.affiliate_url && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.affiliate_url.message}
                </p>
              )}
            </div>
          </div>

          <ImageUploadField
            control={control}
            name="image_url"
            label="Tool Image / Logo"
            folder="tools"
          />
        </div>
      </CollapsibleSection>

      {/* ─── Section 4: SEO (Collapsible) ──────────────────────────────── */}
      <CollapsibleSection title="SEO">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Meta Title</label>
              <CharCounter
                current={watch("meta_title")?.length || 0}
                max={60}
              />
            </div>
            <input
              {...register("meta_title")}
              className="w-full p-2 border rounded-lg"
              placeholder="SEO title (max 60 chars)"
            />
            {errors.meta_title && (
              <p className="text-red-500 text-xs mt-1">
                {errors.meta_title.message}
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Meta Description</label>
              <CharCounter
                current={watch("meta_description")?.length || 0}
                max={160}
              />
            </div>
            <textarea
              {...register("meta_description")}
              rows={3}
              className="w-full p-2 border rounded-lg"
              placeholder="SEO description (max 160 chars)"
            />
            {errors.meta_description && (
              <p className="text-red-500 text-xs mt-1">
                {errors.meta_description.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Canonical URL
            </label>
            <input
              {...register("canonical_url")}
              className="w-full p-2 border rounded-lg"
              placeholder="https://..."
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register("is_indexed")}
              className="w-4 h-4"
            />
            Index this page (allow search engines)
          </label>
        </div>
      </CollapsibleSection>

      {/* ─── Save Actions ─────────────────────────────────────────────── */}
      <div className="flex gap-3 sticky bottom-0 bg-[#fafafa] py-4 border-t border-black/5">
        <button
          type="button"
          onClick={() => router.push("/admin/tools")}
          className="px-6 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-[#111] text-white rounded-lg text-sm font-medium hover:bg-[#333] disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : initialData?.id
              ? "Update Tool"
              : "Create Tool"}
        </button>
      </div>
    </form>
  );
}
