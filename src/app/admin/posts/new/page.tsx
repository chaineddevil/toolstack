"use client";

import { type FormEvent, useState } from "react";

export default function AdminNewPostPage() {
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const payload = {
      title: String(fd.get("title") || ""),
      summary: String(fd.get("summary") || ""),
      body: String(fd.get("body") || ""),
      featured_image: String(fd.get("featured_image") || ""),
      post_type: String(fd.get("post_type") || "article"),
      category_slug: String(fd.get("category_slug") || ""),
      published: fd.get("published") === "on",
      tool_slugs: String(fd.get("tool_slugs") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    setSaving(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "Failed to save post");
      return;
    }
    alert("Post saved.");
    event.currentTarget.reset();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-[#111]">
      <header className="mb-6 space-y-1">
        <h1 className="text-lg font-semibold">New Post</h1>
        <p className="text-xs text-[#666]">
          Write an article, tool review, or comparison post.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-xs font-medium">
            Title *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-[#111] focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="summary" className="text-xs font-medium">
            Summary
          </label>
          <input
            id="summary"
            name="summary"
            type="text"
            placeholder="One-line summary for cards and SEO"
            className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-[#111] focus:outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="post_type" className="text-xs font-medium">
              Post Type
            </label>
            <select
              id="post_type"
              name="post_type"
              className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-[#111] focus:outline-none"
            >
              <option value="article">Article</option>
              <option value="review">Tool Review</option>
              <option value="comparison">Comparison</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="category_slug" className="text-xs font-medium">
              Category
            </label>
            <select
              id="category_slug"
              name="category_slug"
              className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-[#111] focus:outline-none"
            >
              <option value="">None</option>
              <option value="no-code">No-Code Tools</option>
              <option value="ai-automation">AI &amp; Automation</option>
              <option value="design-ux">Design &amp; UX</option>
              <option value="marketing">Marketing Tools</option>
              <option value="developer">Developer Tools</option>
              <option value="business-productivity">
                Business &amp; Productivity
              </option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="featured_image" className="text-xs font-medium">
            Featured Image URL
          </label>
          <input
            id="featured_image"
            name="featured_image"
            type="url"
            placeholder="https://..."
            className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-[#111] focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="tool_slugs" className="text-xs font-medium">
            Linked Tool Slugs
          </label>
          <input
            id="tool_slugs"
            name="tool_slugs"
            type="text"
            placeholder="notion, figma, webflow (comma-separated)"
            className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-[#111] focus:outline-none"
          />
          <p className="text-[11px] text-[#999]">
            These tools will appear in the sidebar with affiliate links.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="body" className="text-xs font-medium">
            Body (Markdown) *
          </label>
          <textarea
            id="body"
            name="body"
            rows={16}
            required
            placeholder="Write your post in Markdown..."
            className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm font-mono focus:border-[#111] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="published"
            name="published"
            type="checkbox"
            className="h-4 w-4"
          />
          <label htmlFor="published" className="text-xs font-medium">
            Publish immediately
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-[#111] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#333] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Post"}
        </button>
      </form>
    </div>
  );
}
