"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toolSchema, type ToolFormData } from "@/lib/schemas/tool";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ToolEditForm({ initialData }: { initialData?: ToolFormData }) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const form = useForm<ToolFormData>({
        resolver: zodResolver(toolSchema),
        defaultValues: initialData || {
            status: "draft",
            is_indexed: true,
            pros: [],
            cons: [],
            use_cases: [],
        },
    });

    const { register, handleSubmit, formState: { errors } } = form;

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
        } catch (e) {
            alert("Error saving tool");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <section className="bg-white p-6 rounded-xl border border-black/5 space-y-4">
                        <h3 className="font-semibold text-lg">Basic Info</h3>

                        <div className="grid gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input {...register("name")} className="w-full p-2 border rounded-lg" />
                                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Slug</label>
                                <input {...register("slug")} className="w-full p-2 border rounded-lg" />
                                {errors.slug && <p className="text-red-500 text-xs">{errors.slug.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Tagline</label>
                                <input {...register("tagline")} className="w-full p-2 border rounded-lg" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea {...register("description")} rows={4} className="w-full p-2 border rounded-lg" />
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-6 rounded-xl border border-black/5 space-y-4">
                        <h3 className="font-semibold text-lg">URLs & Media</h3>
                        <div className="grid gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Website URL</label>
                                <input {...register("website_url")} className="w-full p-2 border rounded-lg" />
                                {errors.website_url && <p className="text-red-500 text-xs">{errors.website_url.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Affiliate URL</label>
                                <input {...register("affiliate_url")} className="w-full p-2 border rounded-lg" />
                                {errors.affiliate_url && <p className="text-red-500 text-xs">{errors.affiliate_url.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Image URL</label>
                                <input {...register("image_url")} className="w-full p-2 border rounded-lg" />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <section className="bg-white p-6 rounded-xl border border-black/5 space-y-4">
                        <h3 className="font-semibold text-lg">Publishing</h3>

                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select {...register("status")} className="w-full p-2 border rounded-lg">
                                <option value="draft">Draft</option>
                                <option value="needs_review">Needs Review</option>
                                <option value="approved">Approved</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t border-black/5">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-[#111] text-white py-2 rounded-lg font-medium hover:bg-[#333] disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save Tool"}
                            </button>
                        </div>
                    </section>

                    <section className="bg-white p-6 rounded-xl border border-black/5 space-y-4">
                        <h3 className="font-semibold text-lg">SEO</h3>
                        <div>
                            <label className="block text-sm font-medium mb-1">Meta Title</label>
                            <input {...register("meta_title")} className="w-full p-2 border rounded-lg" />
                            {errors.meta_title && <p className="text-red-500 text-xs">{errors.meta_title.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Meta Description</label>
                            <textarea {...register("meta_description")} rows={3} className="w-full p-2 border rounded-lg" />
                            {errors.meta_description && <p className="text-red-500 text-xs">{errors.meta_description.message}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" {...register("is_indexed")} id="is_indexed" className="w-4 h-4" />
                            <label htmlFor="is_indexed" className="text-sm font-medium">Index this page</label>
                        </div>
                    </section>
                </div>
            </div>
        </form>
    );
}
