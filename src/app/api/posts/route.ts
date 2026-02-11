import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const posts = db
    .prepare(
      "SELECT id, slug, title, summary, body, featured_image, post_type, category_slug, published, created_at, updated_at FROM posts ORDER BY created_at DESC"
    )
    .all();
  return NextResponse.json(posts);
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

  const db = getDb();

  const slugBase = body.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = slugBase || "post";
  let suffix = 1;
  while (
    db.prepare("SELECT 1 FROM posts WHERE slug = ?").get(slug) as
      | { 1: number }
      | undefined
  ) {
    slug = `${slugBase}-${suffix++}`;
  }

  const stmt = db.prepare(
    `INSERT INTO posts (slug, title, body, summary, featured_image, post_type, category_slug, published)
     VALUES (@slug, @title, @body, @summary, @featured_image, @post_type, @category_slug, @published)`
  );

  const res = stmt.run({
    slug,
    title: body.title,
    body: body.body,
    summary: body.summary ?? null,
    featured_image: body.featured_image ?? null,
    post_type: body.post_type ?? "article",
    category_slug: body.category_slug ?? null,
    published: body.published ? 1 : 0,
  });

  const postId = Number(res.lastInsertRowid);

  // Link tools
  const toolSlugs = body.tool_slugs ?? [];
  if (toolSlugs.length > 0) {
    const getToolStmt = db.prepare("SELECT id FROM tools WHERE slug = ?");
    const insertLink = db.prepare(
      `INSERT INTO post_tools (post_id, tool_id, sort_order)
       VALUES (@post_id, @tool_id, @sort_order)`
    );
    db.transaction(() => {
      let order = 1;
      for (const toolSlug of toolSlugs) {
        const tool = getToolStmt.get(toolSlug) as { id: number } | undefined;
        if (!tool) continue;
        insertLink.run({ post_id: postId, tool_id: tool.id, sort_order: order++ });
      }
    })();
  }

  return NextResponse.json({ id: postId, slug });
}
