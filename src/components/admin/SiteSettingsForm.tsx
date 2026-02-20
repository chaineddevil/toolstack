"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  settingsSchema,
  type SettingsFormData,
} from "@/lib/schemas/settings";
import { useState } from "react";
import CollapsibleSection from "./CollapsibleSection";
import ImageUploadField from "./ImageUploadField";
import CharCounter from "./CharCounter";

interface SiteSettingsFormProps {
  initialData: SettingsFormData;
}

export default function SiteSettingsForm({
  initialData,
}: SiteSettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialData,
  });

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = form;

  async function onSubmit(data: SettingsFormData) {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      {/* ─── Branding ──────────────────────────────────────────────────── */}
      <section className="bg-white p-6 rounded-xl border border-black/5 space-y-4">
        <h3 className="font-semibold text-lg">Branding</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">
              Site Name *
            </label>
            <input
              {...register("site_name")}
              className="w-full p-2 border rounded-lg"
            />
            {errors.site_name && (
              <p className="text-red-500 text-xs mt-1">
                {errors.site_name.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Site Tagline
            </label>
            <input
              {...register("site_tagline")}
              className="w-full p-2 border rounded-lg"
              placeholder="Your catchy tagline"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ImageUploadField
            control={control}
            name="logo_url"
            label="Logo"
            folder="branding"
          />
          <ImageUploadField
            control={control}
            name="favicon_url"
            label="Favicon"
            folder="branding"
          />
        </div>
      </section>

      {/* ─── SEO Defaults ──────────────────────────────────────────────── */}
      <CollapsibleSection title="SEO Defaults">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Default Meta Title</label>
              <CharCounter
                current={watch("default_meta_title")?.length || 0}
                max={60}
              />
            </div>
            <input
              {...register("default_meta_title")}
              className="w-full p-2 border rounded-lg"
              placeholder="ToolStack — Discover the Best SaaS Tools"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">
                Default Meta Description
              </label>
              <CharCounter
                current={watch("default_meta_description")?.length || 0}
                max={160}
              />
            </div>
            <textarea
              {...register("default_meta_description")}
              rows={3}
              className="w-full p-2 border rounded-lg"
              placeholder="Curated SaaS tool reviews, comparisons, and recommendations."
            />
          </div>
          <ImageUploadField
            control={control}
            name="default_og_image"
            label="Default OG Image"
            folder="seo"
          />
        </div>
      </CollapsibleSection>

      {/* ─── Social Links ──────────────────────────────────────────────── */}
      <CollapsibleSection title="Social Links">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Twitter / X</label>
            <input
              {...register("social_links.twitter")}
              className="w-full p-2 border rounded-lg"
              placeholder="https://twitter.com/yourhandle"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">LinkedIn</label>
            <input
              {...register("social_links.linkedin")}
              className="w-full p-2 border rounded-lg"
              placeholder="https://linkedin.com/company/yourcompany"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">YouTube</label>
            <input
              {...register("social_links.youtube")}
              className="w-full p-2 border rounded-lg"
              placeholder="https://youtube.com/@yourchannel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">GitHub</label>
            <input
              {...register("social_links.github")}
              className="w-full p-2 border rounded-lg"
              placeholder="https://github.com/yourorg"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* ─── Compliance ────────────────────────────────────────────────── */}
      <CollapsibleSection title="Compliance">
        <div>
          <label className="block text-sm font-medium mb-1">
            FTC Disclosure
          </label>
          <textarea
            {...register("ftc_disclosure")}
            rows={4}
            className="w-full p-2 border rounded-lg"
            placeholder="This site may contain affiliate links..."
          />
          <p className="text-xs text-gray-400 mt-1">
            Displayed on pages with affiliate links
          </p>
        </div>
      </CollapsibleSection>

      {/* ─── Save Actions ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 sticky bottom-0 bg-[#fafafa] py-4 border-t border-black/5">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-[#111] text-white rounded-lg text-sm font-medium hover:bg-[#333] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {success && (
          <span className="text-sm text-emerald-600 font-medium">
            Settings saved successfully!
          </span>
        )}
      </div>
    </form>
  );
}
