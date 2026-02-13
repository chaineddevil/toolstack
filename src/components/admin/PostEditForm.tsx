"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { postSchema, type PostFormData } from "@/lib/schemas/post";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PostEditForm({ initialData }: { initialData?: PostFormData }) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const form = useForm<PostFormData>({
        resolver: zodResolver(postSchema),
        defaultValues: initialData || {
            status: "draft",
            post_type: "article",
            is_indexed: true,
        },
    });

    const { register, handleSubmit, formState: { errors } } = form;

    async function onSubmit(data: PostFormData) {
        setSaving(true);
        try {
            const url = initialData?.id
                ? `/api/posts/${initialData.id}`
                : "/api/posts";

            const method = initialData?.id ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Failed to save");

            router.refresh();
            router.push("/admin/posts");
        } catch (e) {
            alert("Error saving post");
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
                        <h3 className="font-semibold text-lg">Post Content</h3>

                        <div className="grid gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input {...register("title")} className="w-full p-2 border rounded-lg" />
                                {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Slug</label>
                                <input {...register("slug")} className="w-full p-2 border rounded-lg" />
                                {errors.slug && <p className="text-red-500 text-xs">{errors.slug.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Summary</label>
                                <textarea {...register("summary")} rows={2} className="w-full p-2 border rounded-lg" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Content (Markdown)</label>
                                <textarea {...register("content")} rows={15} className="w-full p-2 border rounded-lg font-mono text-sm" />
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-6 rounded-xl border border-black/5 space-y-4">
                        <h3 className="font-semibold text-lg">Media</h3>
                        <div className="grid gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Featured Image URL</label>
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
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <select {...register("post_type")} className="w-full p-2 border rounded-lg mb-4">
                                <option value="article">Article</option>
                                <option value="review">Review</option>
                                <option value="comparison">Comparison</option>
                            </select>

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
                                {saving ? "Saving..." : "Save Post"}
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
