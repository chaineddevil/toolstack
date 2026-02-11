import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    summary?: string | null;
    body?: string;
    featured_image?: string | null;
    post_type?: string;
    category_slug?: string | null;
    published?: boolean;
    tool_slugs?: string[];
  };

  const supabase = createAdminClient();

  // Check existence
  const { data: existing } = await supabase
    .from("posts")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Build update object — only include provided fields
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) update.title = body.title;
  if (body.summary !== undefined) update.summary = body.summary;
  if (body.body !== undefined) update.body = body.body;
  if (body.featured_image !== undefined) update.featured_image = body.featured_image;
  if (body.post_type !== undefined) update.post_type = body.post_type;
  if (body.category_slug !== undefined) update.category_slug = body.category_slug;
  if (body.published !== undefined) update.published = body.published;

  const { error } = await supabase.from("posts").update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update tool links if provided
  if (body.tool_slugs) {
    // Delete existing links
    await supabase.from("post_tools").delete().eq("post_id", id);

    if (body.tool_slugs.length > 0) {
      const { data: tools } = await supabase
        .from("tools")
        .select("id, slug")
        .in("slug", body.tool_slugs);

      if (tools && tools.length > 0) {
        const slugToId = new Map(tools.map((t) => [t.slug, t.id]));
        const links = body.tool_slugs
          .map((s, i) => {
            const toolId = slugToId.get(s);
            return toolId ? { post_id: id, tool_id: toolId, sort_order: i + 1 } : null;
          })
          .filter(Boolean);

        if (links.length > 0) {
          await supabase.from("post_tools").insert(links);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
