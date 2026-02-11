"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, type FormEvent } from "react";

type Tool = {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  category_slug: string;
  affiliate_url: string;
  image_url: string;
  rating: number | null;
  featured: number;
  published: number;
};

export default function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadTools();
  }, []);

  async function loadTools() {
    setLoading(true);
    const res = await fetch("/api/products");
    const data = (await res.json()) as Tool[];
    setTools(data);
    setLoading(false);
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      tagline: String(fd.get("tagline") || ""),
      description: String(fd.get("description") || ""),
      what_it_is: String(fd.get("what_it_is") || ""),
      who_its_for: String(fd.get("who_its_for") || ""),
      pricing_summary: String(fd.get("pricing_summary") || ""),
      affiliate_url: String(fd.get("affiliate_url") || ""),
      website_url: String(fd.get("website_url") || ""),
      image_url: String(fd.get("image_url") || ""),
      category_slug: String(fd.get("category_slug") || ""),
    };

    setSaving(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "Failed to create tool");
      return;
    }
    alert("Tool created!");
    event.currentTarget.reset();
    void loadTools();
  }

  async function togglePublished(tool: Tool) {
    await fetch(`/api/products/${tool.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !tool.published }),
    });
    void loadTools();
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 text-[#111] md:flex-row">
      {/* Create Form */}
      <form onSubmit={onCreate} className="w-full space-y-4 md:max-w-sm">
        <h2 className="text-sm font-semibold">Add New Tool</h2>

        {[
          { name: "name", label: "Tool Name", required: true },
          { name: "tagline", label: "Tagline" },
          { name: "description", label: "Description", required: true },
          { name: "what_it_is", label: "What It Is" },
          { name: "who_its_for", label: "Who It's For" },
          { name: "pricing_summary", label: "Pricing Summary" },
          { name: "affiliate_url", label: "Affiliate URL", required: true },
          { name: "website_url", label: "Website URL" },
          { name: "image_url", label: "Image URL" },
        ].map((field) => (
          <div key={field.name} className="space-y-1">
            <label htmlFor={field.name} className="text-xs font-medium text-[#666]">
              {field.label} {field.required && "*"}
            </label>
            <input
              id={field.name}
              name={field.name}
              type="text"
              required={field.required}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-[#111] focus:outline-none"
            />
          </div>
        ))}

        <div className="space-y-1">
          <label htmlFor="category_slug" className="text-xs font-medium text-[#666]">
            Category
          </label>
          <select
            id="category_slug"
            name="category_slug"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-[#111] focus:outline-none"
          >
            <option value="">Select</option>
            <option value="no-code">No-Code Tools</option>
            <option value="ai-automation">AI &amp; Automation</option>
            <option value="design-ux">Design &amp; UX</option>
            <option value="marketing">Marketing Tools</option>
            <option value="developer">Developer Tools</option>
            <option value="business-productivity">Business &amp; Productivity</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-[#111] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#333] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Create Tool"}
        </button>
      </form>

      {/* Tool List */}
      <div className="flex-1 space-y-3">
        <h2 className="text-sm font-semibold">All Tools ({tools.length})</h2>
        {loading ? (
          <p className="text-xs text-[#999]">Loading...</p>
        ) : (
          <div className="space-y-2">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="flex items-center gap-3 rounded-xl border border-black/5 bg-[#fafafa] p-3"
              >
                {tool.image_url && (
                  <img
                    src={tool.image_url}
                    alt={tool.name}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{tool.name}</p>
                  <p className="text-xs text-[#666]">
                    {tool.category_slug} · {tool.tagline}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => togglePublished(tool)}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                    tool.published
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {tool.published ? "Published" : "Draft"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
