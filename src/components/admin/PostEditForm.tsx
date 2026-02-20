"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { postSchema, type PostFormData } from "@/lib/schemas/post";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CollapsibleSection from "./CollapsibleSection";
import MarkdownEditor from "./MarkdownEditor";
import ImageUploadField from "./ImageUploadField";
import CharCounter from "./CharCounter";

interface PostEditFormProps {
  initialData?: PostFormData;
  authors?: Array<{ id: number; name: string }>;
  categories?: Array<{ id: number; name: string; slug: string }>;
  tools?: Array<{ id: number; name: string; slug: string }>;
  posts?: Array<{ slug: string; title: string }>;
  initialCategoryIds?: number[];
  initialToolAssignments?: PostFormData["tool_assignments"];
}

export default function PostEditForm({
  initialData,
  authors = [],
  categories = [],
  tools = [],
  posts = [],
  initialCategoryIds = [],
  initialToolAssignments = [],
}: PostEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    !!initialData?.slug
  );

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: initialData || {
      title: "",
      slug: "",
      summary: "",
      content: "",
      image_url: "",
      post_type: "article",
      blog_type: "standard",
      status: "draft",
      is_indexed: true,
      show_in_nav: false,
      sort_order: 0,
      category_ids: initialCategoryIds,
      faq_items: [],
      tool_assignments: initialToolAssignments,
      secondary_keywords: [],
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

  // FAQ field array
  const {
    fields: faqFields,
    append: appendFaq,
    remove: removeFaq,
  } = useFieldArray({ control, name: "faq_items" });

  // Tool assignments field array
  const {
    fields: toolFields,
    append: appendTool,
    remove: removeTool,
  } = useFieldArray({ control, name: "tool_assignments" });

  // Auto-generate slug from title
  const titleValue = watch("title");
  useEffect(() => {
    if (!slugManuallyEdited && titleValue) {
      const slug = titleValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", slug);
    }
  }, [titleValue, slugManuallyEdited, setValue]);

  // Tool assignment add handler
  const [selectedToolId, setSelectedToolId] = useState<string>("");
  function handleAddTool() {
    const id = parseInt(selectedToolId);
    if (!id) return;
    const existing = watch("tool_assignments") || [];
    if (existing.some((t) => t.tool_id === id)) return;
    appendTool({
      tool_id: id,
      sort_order: existing.length,
      caption: "",
      short_editorial: "",
      rating: undefined,
      pros: [],
      cons: [],
      who_its_for: "",
      verdict_badge: "",
      testing_notes: "",
    });
    setSelectedToolId("");
  }

  // Internal link suggestions
  const [linkSuggestions, setLinkSuggestions] = useState<
    Array<{ slug: string; title: string; reason: string }>
  >([]);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);

  function loadLinkSuggestions() {
    if (suggestionsLoaded) return;
    const content = (watch("content") || "").toLowerCase();
    const title = (watch("title") || "").toLowerCase();
    const suggestions = posts
      .filter((p) => p.slug !== initialData?.slug)
      .map((p) => {
        const titleWords = p.title.toLowerCase().split(/\s+/);
        const matches = titleWords.filter(
          (w) => w.length > 3 && (content.includes(w) || title.includes(w))
        );
        return {
          slug: p.slug,
          title: p.title,
          reason:
            matches.length > 0
              ? `Keyword match: ${matches.slice(0, 3).join(", ")}`
              : "",
          score: matches.length,
        };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    setLinkSuggestions(suggestions);
    setSuggestionsLoaded(true);
  }

  // Secondary keywords as comma-separated input
  const [keywordsInput, setKeywordsInput] = useState(
    initialData?.secondary_keywords?.join(", ") || ""
  );
  useEffect(() => {
    const kws = keywordsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setValue("secondary_keywords", kws);
  }, [keywordsInput, setValue]);

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
    } catch {
      alert("Error saving post");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-5xl">
      {/* ─── Section 1: Post Details (Always Open) ──────────────────── */}
      <section className="bg-white p-6 rounded-xl border border-black/5 space-y-4">
        <h3 className="font-semibold text-lg">Post Details</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              {...register("title")}
              className="w-full p-2 border rounded-lg"
              placeholder="Post title"
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">
                {errors.title.message}
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
          <label className="block text-sm font-medium mb-1">Summary</label>
          <textarea
            {...register("summary")}
            rows={2}
            className="w-full p-2 border rounded-lg"
            placeholder="Brief summary or excerpt"
          />
        </div>

        <ImageUploadField
          control={control}
          name="image_url"
          label="Cover Image"
          folder="posts"
        />

        <MarkdownEditor
          control={control}
          name="content"
          label="Content (Markdown)"
          posts={posts}
          tools={tools.map((t) => ({ slug: t.slug, name: t.name }))}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium mb-1">Post Type</label>
            <select
              {...register("post_type")}
              className="w-full p-2 border rounded-lg"
            >
              <option value="article">Article</option>
              <option value="review">Review</option>
              <option value="comparison">Comparison</option>
              <option value="guide">Guide</option>
              <option value="roundup">Roundup</option>
              <option value="news">News</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Blog Type</label>
            <select
              {...register("blog_type")}
              className="w-full p-2 border rounded-lg"
            >
              <option value="standard">Standard</option>
              <option value="listicle">Listicle</option>
              <option value="hub">Hub</option>
              <option value="editorial">Editorial</option>
            </select>
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
          <div>
            <label className="block text-sm font-medium mb-1">Sort Order</label>
            <input
              type="number"
              {...register("sort_order", { valueAsNumber: true })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register("show_in_nav")}
              className="w-4 h-4"
            />
            Show in nav
          </label>
          {watch("show_in_nav") && (
            <div className="flex gap-2">
              <input
                {...register("nav_label")}
                className="p-2 border rounded-lg text-sm"
                placeholder="Nav label"
              />
              <input
                type="number"
                {...register("nav_position", { valueAsNumber: true })}
                className="p-2 border rounded-lg text-sm w-20"
                placeholder="Pos"
              />
            </div>
          )}
        </div>
      </section>

      {/* ─── Section 2: Author & Publishing ──────────────────────────── */}
      <CollapsibleSection title="Author & Publishing">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Author</label>
            <select
              {...register("author_id", { valueAsNumber: true })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">No author</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Publish Date
            </label>
            <input
              type="datetime-local"
              {...register("publish_date")}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* ─── Section 3: SEO Metadata ─────────────────────────────────── */}
      <CollapsibleSection title="SEO Metadata">
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
              rows={2}
              className="w-full p-2 border rounded-lg"
              placeholder="SEO description (max 160 chars)"
            />
            {errors.meta_description && (
              <p className="text-red-500 text-xs mt-1">
                {errors.meta_description.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                Primary Keyword
              </label>
              <input
                {...register("primary_keyword")}
                className="w-full p-2 border rounded-lg"
                placeholder="e.g., best no-code tools"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Search Intent
              </label>
              <select
                {...register("search_intent")}
                className="w-full p-2 border rounded-lg"
              >
                <option value="informational">Informational</option>
                <option value="commercial">Commercial Investigation</option>
                <option value="transactional">Transactional</option>
                <option value="navigational">Navigational</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Secondary Keywords{" "}
              <span className="text-gray-400 font-normal">
                (comma-separated)
              </span>
            </label>
            <input
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
            <ImageUploadField
              control={control}
              name="og_image"
              label="OG Image"
              folder="seo"
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

      {/* ─── Section 4: Categories ────────────────────────────────────── */}
      <CollapsibleSection title="Categories">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-2 p-2 rounded-lg border border-black/5 hover:bg-gray-50 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                value={cat.id}
                checked={(watch("category_ids") || []).includes(cat.id)}
                onChange={(e) => {
                  const current = watch("category_ids") || [];
                  if (e.target.checked) {
                    setValue("category_ids", [...current, cat.id]);
                  } else {
                    setValue(
                      "category_ids",
                      current.filter((id) => id !== cat.id)
                    );
                  }
                }}
                className="w-4 h-4"
              />
              {cat.name}
            </label>
          ))}
          {categories.length === 0 && (
            <p className="text-gray-400 text-sm col-span-full">
              No categories available.
            </p>
          )}
        </div>
      </CollapsibleSection>

      {/* ─── Section 5: FAQ Items ─────────────────────────────────────── */}
      <CollapsibleSection title="FAQ Items">
        <div className="space-y-4">
          {faqFields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 border border-black/5 rounded-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-gray-400">
                  FAQ #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeFaq(index)}
                  className="text-red-500 text-xs hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Question
                </label>
                <input
                  {...register(`faq_items.${index}.question`)}
                  className="w-full p-2 border rounded-lg text-sm"
                  placeholder="What is...?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Answer
                </label>
                <textarea
                  {...register(`faq_items.${index}.answer`)}
                  rows={3}
                  className="w-full p-2 border rounded-lg text-sm"
                  placeholder="The answer is..."
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendFaq({ question: "", answer: "" })}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add FAQ Item
          </button>
        </div>
      </CollapsibleSection>

      {/* ─── Section 6: Internal Link Suggestions ─────────────────────── */}
      <CollapsibleSection title="Internal Link Suggestions">
        <div>
          {!suggestionsLoaded ? (
            <button
              type="button"
              onClick={loadLinkSuggestions}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Analyze content for link opportunities
            </button>
          ) : linkSuggestions.length > 0 ? (
            <div className="space-y-2">
              {linkSuggestions.map((s) => (
                <div
                  key={s.slug}
                  className="flex items-center justify-between p-3 border border-black/5 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-gray-400">{s.reason}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `[${s.title}](/blog/${s.slug})`
                      );
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                  >
                    Copy Link
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              No matching internal links found for your current content.
            </p>
          )}
        </div>
      </CollapsibleSection>

      {/* ─── Section 7: Assigned Tools (Always Open) ──────────────────── */}
      <section className="bg-white p-6 rounded-xl border border-black/5 space-y-4">
        <h3 className="font-semibold text-lg">Assigned Tools</h3>

        <div className="flex gap-2">
          <select
            value={selectedToolId}
            onChange={(e) => setSelectedToolId(e.target.value)}
            className="flex-1 p-2 border rounded-lg text-sm"
          >
            <option value="">Select a tool to add...</option>
            {tools
              .filter(
                (t) =>
                  !(watch("tool_assignments") || []).some(
                    (a) => a.tool_id === t.id
                  )
              )
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={handleAddTool}
            disabled={!selectedToolId}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Add
          </button>
        </div>

        <div className="space-y-4">
          {toolFields.map((field, index) => {
            const tool = tools.find(
              (t) => t.id === watch(`tool_assignments.${index}.tool_id`)
            );
            return (
              <details
                key={field.id}
                className="border border-black/5 rounded-lg overflow-hidden"
              >
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400 w-6">
                      #{index + 1}
                    </span>
                    <span className="font-medium text-sm">
                      {tool?.name ||
                        `Tool #${watch(`tool_assignments.${index}.tool_id`)}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      removeTool(index);
                    }}
                    className="text-red-500 text-xs hover:text-red-700"
                  >
                    Remove
                  </button>
                </summary>
                <div className="p-4 pt-0 space-y-3 border-t border-black/5">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Position
                      </label>
                      <input
                        type="number"
                        {...register(
                          `tool_assignments.${index}.sort_order`,
                          { valueAsNumber: true }
                        )}
                        className="w-full p-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Rating (0-5)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="5"
                        {...register(
                          `tool_assignments.${index}.rating`,
                          { valueAsNumber: true }
                        )}
                        className="w-full p-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Verdict Badge
                      </label>
                      <select
                        {...register(
                          `tool_assignments.${index}.verdict_badge`
                        )}
                        className="w-full p-2 border rounded-lg text-sm"
                      >
                        <option value="">None</option>
                        <option value="best_overall">Best Overall</option>
                        <option value="best_budget">Best Budget</option>
                        <option value="most_unique">Most Unique</option>
                        <option value="editors_choice">
                          Editor&apos;s Choice
                        </option>
                        <option value="best_value">Best Value</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Caption
                    </label>
                    <input
                      {...register(`tool_assignments.${index}.caption`)}
                      className="w-full p-2 border rounded-lg text-sm"
                      placeholder="Brief caption"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Short Editorial (mini-review)
                    </label>
                    <textarea
                      {...register(
                        `tool_assignments.${index}.short_editorial`
                      )}
                      rows={3}
                      className="w-full p-2 border rounded-lg text-sm"
                      placeholder="150-300 word mini review..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Who It&apos;s For
                    </label>
                    <input
                      {...register(
                        `tool_assignments.${index}.who_its_for`
                      )}
                      className="w-full p-2 border rounded-lg text-sm"
                      placeholder="e.g., Solo creators who need..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Testing Notes
                    </label>
                    <textarea
                      {...register(
                        `tool_assignments.${index}.testing_notes`
                      )}
                      rows={2}
                      className="w-full p-2 border rounded-lg text-sm"
                      placeholder="Notes from testing..."
                    />
                  </div>
                </div>
              </details>
            );
          })}
          {toolFields.length === 0 && (
            <p className="text-sm text-gray-400">
              No tools assigned yet. Select a tool above to add it.
            </p>
          )}
        </div>
      </section>

      {/* ─── Save Actions ─────────────────────────────────────────────── */}
      <div className="flex gap-3 sticky bottom-0 bg-[#fafafa] py-4 border-t border-black/5">
        <button
          type="button"
          onClick={() => router.push("/admin/posts")}
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
              ? "Update Post"
              : "Create Post"}
        </button>
      </div>
    </form>
  );
}
