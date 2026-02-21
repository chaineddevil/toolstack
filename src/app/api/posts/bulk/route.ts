import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { getUserRole } from "@/lib/auth";
import { z } from "zod";
import { postSchema, type PostFormData } from "@/lib/schemas/post";

// Bulk upload schema: array of posts wrapped in { posts: [...] }
const bulkUploadSchema = z.object({
  posts: z
    .array(postSchema.omit({ id: true }))
    .min(1, "At least 1 post is required")
    .max(50, "Maximum 50 posts per upload"),
});

type BulkResult = {
  index: number;
  slug: string;
  title: string;
  status: "success" | "error";
  postId?: number;
  error?: string;
};

function mapPostToDbRow(
  post: Omit<PostFormData, "id">,
  userId?: string
): Record<string, unknown> {
  const postData: Record<string, unknown> = {
    title: post.title,
    slug: post.slug,
    summary: post.summary || null,
    body: post.content || null,
    featured_image: post.image_url || null,
    featured_image_alt: post.featured_image_alt || null,
    post_type: post.post_type,
    blog_type: post.blog_type || "standard",
    status: post.status,
    sort_order: post.sort_order || 0,
    show_in_nav: post.show_in_nav || false,
    nav_label: post.nav_label || null,
    nav_position: post.nav_position || 0,
    meta_title: post.meta_title || null,
    meta_description: post.meta_description || null,
    canonical_url: post.canonical_url || null,
    is_indexed: post.is_indexed ?? true,
    submitted_by: userId,
    author_id: post.author_id || null,
    publish_date: post.publish_date || null,
    primary_keyword: post.primary_keyword || null,
    search_intent: post.search_intent || "informational",
    secondary_keywords: post.secondary_keywords || [],
    og_image: post.og_image || null,
    faq_items: post.faq_items || [],
    category_slug: post.category_slug || null,
  };

  if (post.status === "published") {
    postData.published_at = new Date().toISOString();
  }

  return postData;
}

export async function POST(request: NextRequest) {
  // Auth check — same as single-post route
  const role = await getUserRole();
  if (!role || !["super_admin", "manager", "editor"].includes(role)) {
    if (role !== "data_entry") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate with Zod
  const parseResult = bulkUploadSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parseResult.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const { posts } = parseResult.data;

  // Force draft for data_entry role
  if (role === "data_entry") {
    for (const post of posts) {
      post.status = "draft";
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const results: BulkResult[] = [];

  // Sequential insertion — preserves slug uniqueness error reporting
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    try {
      // 1. Insert the post
      const postData = mapPostToDbRow(post, user?.id);
      const { data, error } = await supabase
        .from("posts")
        .insert(postData)
        .select()
        .single();

      if (error) throw new Error(error.message);

      const postId = data.id;

      // 2. Category junction rows
      const categoryIds = post.category_ids || [];
      if (categoryIds.length > 0) {
        const catRows = categoryIds.map((category_id) => ({
          post_id: postId,
          category_id,
        }));
        await supabase.from("post_categories").insert(catRows);
      }

      // 3. Tool assignment rows
      const toolAssignments = post.tool_assignments || [];
      if (toolAssignments.length > 0) {
        const toolRows = toolAssignments.map((ta) => ({
          post_id: postId,
          tool_id: ta.tool_id,
          sort_order: ta.sort_order ?? 0,
          caption: ta.caption || null,
          short_editorial: ta.short_editorial || null,
          rating: ta.rating ?? null,
          pros: ta.pros || [],
          cons: ta.cons || [],
          who_its_for: ta.who_its_for || null,
          verdict_badge: ta.verdict_badge || null,
          testing_notes: ta.testing_notes || null,
        }));
        await supabase.from("post_tools").insert(toolRows);
      } else if (post.tool_ids && post.tool_ids.length > 0) {
        const legacyRows = post.tool_ids.map((tool_id, idx) => ({
          post_id: postId,
          tool_id,
          sort_order: idx,
        }));
        await supabase.from("post_tools").insert(legacyRows);
      }

      // 4. Content version snapshot
      await supabase.from("content_versions").insert({
        entity_type: "post",
        entity_id: postId,
        version_data: data,
        edited_by: user?.id,
      });

      results.push({
        index: i,
        slug: post.slug,
        title: post.title,
        status: "success",
        postId,
      });
    } catch (err) {
      results.push({
        index: i,
        slug: post.slug,
        title: post.title,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    total: posts.length,
    succeeded: results.filter((r) => r.status === "success").length,
    failed: results.filter((r) => r.status === "error").length,
    results,
  });
}
