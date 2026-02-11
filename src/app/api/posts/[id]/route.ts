import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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

  const db = getDb();

  const existing = db
    .prepare("SELECT * FROM posts WHERE id = ?")
    .get(id) as { id: number } | undefined;

  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const stmt = db.prepare(
    `UPDATE posts
     SET
       title = COALESCE(@title, title),
       summary = COALESCE(@summary, summary),
       body = COALESCE(@body, body),
       featured_image = COALESCE(@featured_image, featured_image),
       post_type = COALESCE(@post_type, post_type),
       category_slug = COALESCE(@category_slug, category_slug),
       published = COALESCE(@published, published),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = @id`
  );

  stmt.run({
    id,
    title: body.title ?? null,
    summary: body.summary === undefined ? null : body.summary ?? null,
    body: body.body ?? null,
    featured_image:
      body.featured_image === undefined ? null : body.featured_image ?? null,
    post_type: body.post_type ?? null,
    category_slug:
      body.category_slug === undefined ? null : body.category_slug ?? null,
    published: body.published === undefined ? null : body.published ? 1 : 0,
  });

  // Update tool links if provided
  if (body.tool_slugs) {
    const getToolStmt = db.prepare("SELECT id FROM tools WHERE slug = ?");
    const deleteExisting = db.prepare(
      "DELETE FROM post_tools WHERE post_id = ?"
    );
    const insertLink = db.prepare(
      `INSERT INTO post_tools (post_id, tool_id, sort_order)
       VALUES (@post_id, @tool_id, @sort_order)`
    );
    db.transaction(() => {
      deleteExisting.run(id);
      let order = 1;
      for (const toolSlug of body.tool_slugs ?? []) {
        const tool = getToolStmt.get(toolSlug) as { id: number } | undefined;
        if (!tool) continue;
        insertLink.run({ post_id: id, tool_id: tool.id, sort_order: order++ });
      }
    })();
  }

  return NextResponse.json({ ok: true });
}
