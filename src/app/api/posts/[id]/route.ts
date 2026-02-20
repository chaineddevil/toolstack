import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { getUserRole } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const role = await getUserRole();

  if (!role || !["super_admin", "manager", "editor"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = await createClient();
  const body = await request.json();

  // 1. Fetch current for versioning
  const { data: currentData } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (!currentData) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // 2. Version snapshot (save before modifying)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("content_versions").insert({
    entity_type: "post",
    entity_id: id,
    version_data: currentData,
    edited_by: user?.id,
  });

  // 3. Extract relation fields
  const categoryIds: number[] | undefined = body.category_ids;
  const toolAssignments:
    | Array<{
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
      }>
    | undefined = body.tool_assignments;

  // 4. Build postData — map form fields to DB columns
  const postData: Record<string, unknown> = {};

  // Simple direct-mapped fields
  const directFields = [
    "title",
    "slug",
    "summary",
    "post_type",
    "blog_type",
    "status",
    "sort_order",
    "show_in_nav",
    "nav_label",
    "nav_position",
    "meta_title",
    "meta_description",
    "canonical_url",
    "is_indexed",
    "author_id",
    "publish_date",
    "primary_keyword",
    "search_intent",
    "secondary_keywords",
    "og_image",
    "faq_items",
    "category_slug",
    "featured_image_alt",
  ];

  for (const field of directFields) {
    if (field in body) {
      postData[field] = body[field];
    }
  }

  // Renamed fields
  if ("content" in body) {
    postData.body = body.content;
  }
  if ("image_url" in body) {
    postData.featured_image = body.image_url;
  }

  // Handle publish timestamp
  if (body.status === "published" && currentData.status !== "published") {
    postData.published_at = new Date().toISOString();
  }

  // Null out empty optional fields
  if (postData.author_id === "" || postData.author_id === 0) {
    postData.author_id = null;
  }
  if (postData.canonical_url === "") {
    postData.canonical_url = null;
  }
  if (postData.publish_date === "") {
    postData.publish_date = null;
  }

  // 5. Update the post
  const { data, error } = await supabase
    .from("posts")
    .update(postData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 6. Handle category junction (replace strategy)
  if (categoryIds !== undefined) {
    // Delete existing
    await supabase.from("post_categories").delete().eq("post_id", id);
    // Insert new
    if (categoryIds.length > 0) {
      const catRows = categoryIds.map((category_id) => ({
        post_id: parseInt(id),
        category_id,
      }));
      await supabase.from("post_categories").insert(catRows);
    }
  }

  // 7. Handle tool assignments (replace strategy)
  if (toolAssignments !== undefined) {
    // Delete existing
    await supabase.from("post_tools").delete().eq("post_id", id);
    // Insert new
    if (toolAssignments.length > 0) {
      const toolRows = toolAssignments.map((ta) => ({
        post_id: parseInt(id),
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
    }
  } else if (body.tool_ids !== undefined) {
    // Legacy support
    await supabase.from("post_tools").delete().eq("post_id", id);
    if (body.tool_ids.length > 0) {
      const legacyRows = body.tool_ids.map(
        (tool_id: number, i: number) => ({
          post_id: parseInt(id),
          tool_id,
          sort_order: i,
        })
      );
      await supabase.from("post_tools").insert(legacyRows);
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const role = await getUserRole();

  if (!role || role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = await createClient();

  // Junction tables cascade on delete, so just delete the post
  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
