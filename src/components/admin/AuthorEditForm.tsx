"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authorSchema, type AuthorFormData } from "@/lib/schemas/author";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthorEditForm({
  initialData,
}: {
  initialData?: AuthorFormData;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState(
    initialData?.expertise_areas?.join(", ") || ""
  );

  const form = useForm<AuthorFormData>({
    resolver: zodResolver(authorSchema),
    defaultValues: initialData || {
      name: "",
      slug: "",
      bio: "",
      headshot_url: "",
      expertise_areas: [],
      social_profiles: { twitter: "", linkedin: "", youtube: "" },
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  // Auto-generate slug from name
  const nameValue = watch("name");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData?.slug);

  useEffect(() => {
    if (!slugManuallyEdited && nameValue) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", slug);
    }
  }, [nameValue, slugManuallyEdited, setValue]);

  // Sync expertise input to form array
  useEffect(() => {
    const areas = expertiseInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setValue("expertise_areas", areas);
  }, [expertiseInput, setValue]);

  async function onSubmit(data: AuthorFormData) {
    setSaving(true);
    try {
      const url = initialData?.id
        ? `/api/authors/${initialData.id}`
        : "/api/authors";
      const method = initialData?.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to save");

      router.refresh();
      router.push("/admin/authors");
    } catch {
      alert("Error saving author");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
      <section className="bg-white p-6 rounded-xl border border-black/5 space-y-4">
        <h3 className="font-semibold text-lg">Author Details</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              {...register("name")}
              className="w-full p-2 border rounded-lg"
              placeholder="Jane Doe"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input
              {...register("slug")}
              className="w-full p-2 border rounded-lg"
              placeholder="jane-doe"
              onChange={(e) => {
                setSlugManuallyEdited(true);
                register("slug").onChange(e);
              }}
            />
            {errors.slug && (
              <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            {...register("bio")}
            rows={4}
            className="w-full p-2 border rounded-lg"
            placeholder="A short bio about the author..."
          />
        </div>
      </section>

      <section className="bg-white p-6 rounded-xl border border-black/5 space-y-4">
        <h3 className="font-semibold text-lg">Profile</h3>

        <div>
          <label className="block text-sm font-medium mb-1">Headshot URL</label>
          <div className="flex items-center gap-4">
            <input
              {...register("headshot_url")}
              className="flex-1 p-2 border rounded-lg"
              placeholder="https://example.com/photo.jpg"
            />
            {watch("headshot_url") && (
              <img
                src={watch("headshot_url") || ""}
                alt="Preview"
                className="w-12 h-12 rounded-full object-cover border"
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Expertise Areas{" "}
            <span className="text-gray-400 font-normal">(comma-separated)</span>
          </label>
          <input
            value={expertiseInput}
            onChange={(e) => setExpertiseInput(e.target.value)}
            className="w-full p-2 border rounded-lg"
            placeholder="SaaS, Productivity, No-Code"
          />
          {watch("expertise_areas") && watch("expertise_areas")!.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {watch("expertise_areas")!.map((area) => (
                <span
                  key={area}
                  className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {area}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white p-6 rounded-xl border border-black/5 space-y-4">
        <h3 className="font-semibold text-lg">Social Profiles</h3>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium mb-1">Twitter</label>
            <input
              {...register("social_profiles.twitter")}
              className="w-full p-2 border rounded-lg"
              placeholder="https://twitter.com/username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">LinkedIn</label>
            <input
              {...register("social_profiles.linkedin")}
              className="w-full p-2 border rounded-lg"
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">YouTube</label>
            <input
              {...register("social_profiles.youtube")}
              className="w-full p-2 border rounded-lg"
              placeholder="https://youtube.com/@channel"
            />
          </div>
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/authors")}
          className="px-6 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-[#111] text-white rounded-lg text-sm font-medium hover:bg-[#333] disabled:opacity-50"
        >
          {saving ? "Saving..." : initialData?.id ? "Update Author" : "Create Author"}
        </button>
      </div>
    </form>
  );
}
