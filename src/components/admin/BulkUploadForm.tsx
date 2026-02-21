"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { postSchema } from "@/lib/schemas/post";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = "idle" | "preview" | "uploading" | "done";

type ValidationError = {
  path: string;
  message: string;
};

type ParsedPost = {
  data: Record<string, unknown>;
  valid: boolean;
  errors: ValidationError[];
};

type UploadResult = {
  index: number;
  slug: string;
  title: string;
  status: "success" | "error";
  postId?: number;
  error?: string;
};

type UploadResponse = {
  total: number;
  succeeded: number;
  failed: number;
  results: UploadResult[];
};

interface BulkUploadFormProps {
  categories: Array<{ id: number; name: string; slug: string }>;
  authors: Array<{ id: number; name: string }>;
}

// ─── Template ────────────────────────────────────────────────────────────────

const TEMPLATE = {
  posts: [
    {
      title: "Example Post Title",
      slug: "example-post-title",
      summary: "A brief summary of this post.",
      content: "# Your Markdown Content\n\nWrite your full post body here.",
      image_url: "",
      featured_image_alt: "",
      post_type: "article",
      blog_type: "standard",
      status: "draft",
      sort_order: 0,
      show_in_nav: false,
      nav_label: "",
      nav_position: 0,
      author_id: null,
      publish_date: "",
      meta_title: "",
      meta_description: "",
      primary_keyword: "",
      search_intent: "informational",
      secondary_keywords: [],
      canonical_url: "",
      og_image: "",
      is_indexed: true,
      category_slug: "",
      category_ids: [],
      faq_items: [],
      tool_assignments: [],
      tool_ids: [],
    },
  ],
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function BulkUploadForm({
  categories,
}: BulkUploadFormProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [parsedPosts, setParsedPosts] = useState<ParsedPost[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<UploadResponse | null>(
    null
  );
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category lookup for preview
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  // ─── Template Download ───────────────────────────────────────────────────

  function downloadTemplate() {
    const blob = new Blob([JSON.stringify(TEMPLATE, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sahyai-bulk-upload-template.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── File Parsing ────────────────────────────────────────────────────────

  function handleFile(file: File) {
    setFileError(null);

    if (file.size > 2 * 1024 * 1024) {
      setFileError("File too large. Maximum size is 2MB.");
      return;
    }

    if (!file.name.endsWith(".json")) {
      setFileError("Please upload a .json file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);

        if (!raw.posts || !Array.isArray(raw.posts)) {
          setFileError(
            'Invalid format. Expected { "posts": [...] }. Download the template for reference.'
          );
          return;
        }

        if (raw.posts.length === 0) {
          setFileError("The posts array is empty.");
          return;
        }

        if (raw.posts.length > 50) {
          setFileError(
            `Too many posts (${raw.posts.length}). Maximum is 50 per upload.`
          );
          return;
        }

        // Validate each post with Zod
        const schema = postSchema.omit({ id: true });
        const parsed: ParsedPost[] = raw.posts.map(
          (post: unknown) => {
            const result = schema.safeParse(post);
            if (result.success) {
              return {
                data: result.data as Record<string, unknown>,
                valid: true,
                errors: [],
              };
            }
            return {
              data: (post ?? {}) as Record<string, unknown>,
              valid: false,
              errors: result.error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
              })),
            };
          }
        );

        setParsedPosts(parsed);
        setPhase("preview");
      } catch {
        setFileError("Failed to parse JSON. Check the file format.");
      }
    };
    reader.readAsText(file);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function onDragLeave() {
    setDragOver(false);
  }

  // ─── Upload ──────────────────────────────────────────────────────────────

  async function handleUpload(statusOverride?: "draft" | "published") {
    // Get only valid posts
    const validPosts = parsedPosts
      .filter((p) => p.valid)
      .map((p) => {
        const post = { ...p.data };
        if (statusOverride) {
          post.status = statusOverride;
        }
        return post;
      });

    if (validPosts.length === 0) {
      setFileError("No valid posts to upload.");
      return;
    }

    setPhase("uploading");
    setFileError(null);

    try {
      const res = await fetch("/api/posts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: validPosts }),
      });

      const data = await res.json();

      if (!res.ok && !data.results) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadResults(data);
      setPhase("done");
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Upload failed");
      setPhase("preview");
    }
  }

  // ─── Reset ───────────────────────────────────────────────────────────────

  function reset() {
    setPhase("idle");
    setParsedPosts([]);
    setFileError(null);
    setUploadResults(null);
  }

  // ─── Computed ────────────────────────────────────────────────────────────

  const validCount = parsedPosts.filter((p) => p.valid).length;
  const errorCount = parsedPosts.length - validCount;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {fileError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {fileError}
        </div>
      )}

      {/* ── Phase: Idle ── */}
      {phase === "idle" && (
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
              dragOver
                ? "border-[#111] bg-[#f5f5f5]"
                : "border-black/10 bg-white hover:border-black/25 hover:bg-[#fafafa]"
            }`}
          >
            <div className="text-4xl text-[#999]">
              {/* Upload icon */}
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-[#111]">
              Drop your JSON file here or click to browse
            </p>
            <p className="mt-1 text-xs text-[#999]">
              Maximum 50 posts per file, 2MB max
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={onFileChange}
              className="hidden"
            />
          </div>

          {/* Template download */}
          <div className="flex items-center gap-3">
            <button
              onClick={downloadTemplate}
              className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-[#111] transition-colors hover:bg-[#fafafa]"
            >
              Download Template
            </button>
            <span className="text-xs text-[#999]">
              Use this JSON template to format your posts correctly
            </span>
          </div>

          {/* Field reference */}
          <details className="rounded-xl border border-black/5 bg-white">
            <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-[#666] hover:text-[#111]">
              Field Reference
            </summary>
            <div className="border-t border-black/5 px-5 py-4">
              <div className="grid gap-4 text-xs md:grid-cols-2">
                <div className="space-y-2">
                  <p className="font-semibold text-[#111]">Required Fields</p>
                  <ul className="space-y-1 text-[#666]">
                    <li>
                      <code className="text-[#111]">title</code> — Post title
                      (min 2 chars)
                    </li>
                    <li>
                      <code className="text-[#111]">slug</code> — URL slug (min
                      2 chars, unique)
                    </li>
                    <li>
                      <code className="text-[#111]">post_type</code> — article,
                      review, comparison, guide, roundup, news
                    </li>
                    <li>
                      <code className="text-[#111]">status</code> — draft,
                      needs_review, approved, scheduled, published, archived
                    </li>
                    <li>
                      <code className="text-[#111]">is_indexed</code> — true or
                      false
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-[#111]">Optional Fields</p>
                  <ul className="space-y-1 text-[#666]">
                    <li>
                      <code className="text-[#111]">content</code> — Markdown
                      body
                    </li>
                    <li>
                      <code className="text-[#111]">summary</code> — Brief
                      excerpt
                    </li>
                    <li>
                      <code className="text-[#111]">category_ids</code> — Array
                      of category IDs [1, 3]
                    </li>
                    <li>
                      <code className="text-[#111]">author_id</code> — Author
                      ID or null
                    </li>
                    <li>
                      <code className="text-[#111]">meta_title</code> — SEO
                      title (max 60)
                    </li>
                    <li>
                      <code className="text-[#111]">meta_description</code> —
                      SEO desc (max 160)
                    </li>
                    <li>
                      <code className="text-[#111]">faq_items</code> — Array of{" "}
                      {`{ question, answer }`}
                    </li>
                    <li>
                      <code className="text-[#111]">tool_assignments</code> —
                      Array with tool_id, rating, pros, cons...
                    </li>
                  </ul>
                </div>
              </div>
              {categories.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-[#111]">
                    Available Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <span
                        key={c.id}
                        className="rounded-full border border-black/10 px-2 py-0.5 text-[11px] text-[#666]"
                      >
                        {c.name} (ID: {c.id})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>
        </div>
      )}

      {/* ── Phase: Preview ── */}
      {phase === "preview" && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-4 rounded-lg border border-black/5 bg-white px-5 py-3">
            <p className="text-sm text-[#111]">
              <span className="font-semibold">{parsedPosts.length}</span> posts
              parsed
            </p>
            <span className="text-[#ccc]">|</span>
            <p className="text-sm text-emerald-600">
              <span className="font-semibold">{validCount}</span> valid
            </p>
            {errorCount > 0 && (
              <>
                <span className="text-[#ccc]">|</span>
                <p className="text-sm text-red-600">
                  <span className="font-semibold">{errorCount}</span> with
                  errors
                </p>
              </>
            )}
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#fafafa] text-[#666]">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Categories</th>
                  <th className="px-4 py-3 font-medium">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {parsedPosts.map((post, i) => {
                  const ids = (post.data.category_ids as number[]) || [];
                  const catNames = ids
                    .map((id) => catMap.get(id))
                    .filter(Boolean);

                  return (
                    <tr
                      key={i}
                      className={
                        post.valid ? "hover:bg-[#fafafa]" : "bg-red-50/50"
                      }
                    >
                      <td className="px-4 py-3 text-[#999]">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-[#111]">
                        {(post.data.title as string) || (
                          <span className="text-red-400">Missing</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#666]">
                        {(post.data.slug as string) || (
                          <span className="text-red-400">Missing</span>
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize text-[#666]">
                        {(post.data.post_type as string) || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            post.data.status === "published"
                              ? "bg-emerald-100 text-emerald-700"
                              : post.data.status === "draft"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {(post.data.status as string) || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#666]">
                        {catNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {catNames.map((name) => (
                              <span
                                key={name}
                                className="rounded bg-black/5 px-1.5 py-0.5 text-[11px]"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : ids.length > 0 ? (
                          <span className="text-amber-600 text-xs">
                            IDs: {ids.join(", ")}
                          </span>
                        ) : (
                          <span className="text-[#ccc]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {post.valid ? (
                          <span className="text-emerald-600 text-xs font-medium">
                            Valid
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {post.errors.map((err, j) => (
                              <p
                                key={j}
                                className="text-xs text-red-600"
                              >
                                {err.path ? `${err.path}: ` : ""}
                                {err.message}
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {validCount > 0 && (
              <>
                <button
                  onClick={() => handleUpload("published")}
                  className="rounded-lg bg-[#111] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#333]"
                >
                  Publish All ({validCount})
                </button>
                <button
                  onClick={() => handleUpload("draft")}
                  className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-[#111] transition-colors hover:bg-[#fafafa]"
                >
                  Save All as Draft ({validCount})
                </button>
                <button
                  onClick={() => handleUpload()}
                  className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-[#666] transition-colors hover:bg-[#fafafa]"
                >
                  Upload as-is ({validCount})
                </button>
              </>
            )}
            <button
              onClick={reset}
              className="ml-auto text-sm text-[#999] hover:text-[#666]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Phase: Uploading ── */}
      {phase === "uploading" && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-black/5 bg-white px-6 py-16">
          {/* Animated spinner */}
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#111] border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-[#111]">
            Uploading {validCount} posts...
          </p>
          <p className="mt-1 text-xs text-[#999]">
            This may take up to {Math.max(5, validCount)} seconds. Please don't
            close this page.
          </p>
        </div>
      )}

      {/* ── Phase: Done ── */}
      {phase === "done" && uploadResults && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-4 rounded-lg border border-black/5 bg-white px-5 py-3">
            <p className="text-sm font-semibold text-[#111]">
              Upload Complete
            </p>
            <span className="text-[#ccc]">|</span>
            <p className="text-sm text-emerald-600">
              <span className="font-semibold">
                {uploadResults.succeeded}
              </span>{" "}
              created
            </p>
            {uploadResults.failed > 0 && (
              <>
                <span className="text-[#ccc]">|</span>
                <p className="text-sm text-red-600">
                  <span className="font-semibold">
                    {uploadResults.failed}
                  </span>{" "}
                  failed
                </p>
              </>
            )}
          </div>

          {/* Results table */}
          <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#fafafa] text-[#666]">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Result</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {uploadResults.results.map((r) => (
                  <tr
                    key={r.index}
                    className={
                      r.status === "success"
                        ? "hover:bg-[#fafafa]"
                        : "bg-red-50/50"
                    }
                  >
                    <td className="px-4 py-3 text-[#999]">
                      {r.index + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#111]">
                      {r.title}
                    </td>
                    <td className="px-4 py-3 text-[#666]">{r.slug}</td>
                    <td className="px-4 py-3">
                      {r.status === "success" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <span>&#10003;</span> Created
                        </span>
                      ) : (
                        <span className="text-xs text-red-600">
                          {r.error}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "success" && r.postId && (
                        <Link
                          href={`/admin/posts/${r.postId}`}
                          className="text-xs text-[#111] hover:underline"
                        >
                          Edit
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={reset}
              className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-[#111] transition-colors hover:bg-[#fafafa]"
            >
              Upload More
            </button>
            <Link
              href="/admin/posts"
              className="rounded-lg bg-[#111] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#333]"
            >
              Go to Posts
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
