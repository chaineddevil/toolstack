import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, summary, body, featured_image, post_type, category_slug, published, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    summary?: string;
    body?: string;
    featured_image?: string;
    post_type?: string;
    category_slug?: string;
    published?: boolean;
    tool_slugs?: string[];
  };

  if (!body.title || !body.body) {
    return NextResponse.json(
      { error: "title and body are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Generate unique slug
  const slugBase = body.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = slugBase || "post";
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: existing } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${slugBase}-${suffix++}`;
  }

  const { data: newPost, error } = await supabase
    .from("posts")
    .insert({
      slug,
      title: body.title,
      body: body.body,
      summary: body.summary ?? null,
      featured_image: body.featured_image ?? null,
      post_type: body.post_type ?? "article",
      category_slug: body.category_slug ?? null,
      published: body.published ?? false,
    })
    .select("id, slug")
    .single();

  if (error || !newPost) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  // Link tools
  const toolSlugs = body.tool_slugs ?? [];
  if (toolSlugs.length > 0) {
    const { data: tools } = await supabase
      .from("tools")
      .select("id, slug")
      .in("slug", toolSlugs);

    if (tools && tools.length > 0) {
      const slugToId = new Map(tools.map((t) => [t.slug, t.id]));
      const links = toolSlugs
        .map((s, i) => {
          const toolId = slugToId.get(s);
          return toolId ? { post_id: newPost.id, tool_id: toolId, sort_order: i + 1 } : null;
        })
        .filter(Boolean);

      if (links.length > 0) {
        await supabase.from("post_tools").insert(links);
      }
    }
  }

  return NextResponse.json({ id: newPost.id, slug: newPost.slug });
}
