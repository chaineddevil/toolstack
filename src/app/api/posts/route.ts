import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { getUserRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const role = await getUserRole();
  if (!role || !["super_admin", "manager", "editor"].includes(role)) {
    if (role !== "data_entry") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  const supabase = await createClient();
  const body = await request.json();

  if (role === "data_entry") {
    body.status = "draft";
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Extract relation fields before building postData
  const categoryIds: number[] = body.category_ids || [];
  const toolAssignments: Array<{
    tool_id: number;
    sort_order?: number;
    caption?: string;
    short_editorial?: string;
    rating?: number;
    pros?: string[];
    cons?: string[];
    who_its_for?: string;
    verdict_badge?: string;
    testing_notes?: string;
  }> = body.tool_assignments || [];

  // Map form fields to DB columns
  const postData: Record<string, unknown> = {
    title: body.title,
    slug: body.slug,
    summary: body.summary || null,
    body: body.content || null, // content → body
    featured_image: body.image_url || null, // image_url → featured_image
    featured_image_alt: body.featured_image_alt || null,
    post_type: body.post_type,
    blog_type: body.blog_type || "standard",
    status: body.status,
    sort_order: body.sort_order || 0,
    show_in_nav: body.show_in_nav || false,
    nav_label: body.nav_label || null,
    nav_position: body.nav_position || 0,
    meta_title: body.meta_title || null,
    meta_description: body.meta_description || null,
    canonical_url: body.canonical_url || null,
    is_indexed: body.is_indexed ?? true,
    submitted_by: user?.id,
    // New v3 fields
    author_id: body.author_id || null,
    publish_date: body.publish_date || null,
    primary_keyword: body.primary_keyword || null,
    search_intent: body.search_intent || "informational",
    secondary_keywords: body.secondary_keywords || [],
    og_image: body.og_image || null,
    faq_items: body.faq_items || [],
    category_slug: body.category_slug || null,
  };

  // Handle publish_date auto-set
  if (body.status === "published") {
    postData.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("posts")
    .insert(postData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const postId = data.id;

  // Handle category junction (post_categories)
  if (categoryIds.length > 0) {
    const catRows = categoryIds.map((category_id) => ({
      post_id: postId,
      category_id,
    }));
    await supabase.from("post_categories").insert(catRows);
  }

  // Handle tool assignments (post_tools)
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
  } else if (body.tool_ids?.length > 0) {
    // Legacy: support old tool_ids array (just tool_id + post_id)
    const legacyRows = body.tool_ids.map((tool_id: number, i: number) => ({
      post_id: postId,
      tool_id,
      sort_order: i,
    }));
    await supabase.from("post_tools").insert(legacyRows);
  }

  // Versioning
  await supabase.from("content_versions").insert({
    entity_type: "post",
    entity_id: postId,
    version_data: data,
    edited_by: user?.id,
  });

  return NextResponse.json(data);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const publishedOnly = url.searchParams.get("published") === "true";

  let query = supabase
    .from("posts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (publishedOnly) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
