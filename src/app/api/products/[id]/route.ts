import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Repurposed: now patches the "tools" table

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
    name?: string;
    tagline?: string;
    description?: string;
    what_it_is?: string;
    who_its_for?: string;
    pros?: string[];
    cons?: string[];
    use_cases?: string[];
    pricing_summary?: string;
    affiliate_url?: string;
    website_url?: string;
    image_url?: string;
    logo_url?: string;
    category_slug?: string;
    rating?: number;
    featured?: boolean;
    published?: boolean;
  };

  const db = getDb();

  const existing = db
    .prepare("SELECT * FROM tools WHERE id = ?")
    .get(id) as { id: number } | undefined;

  if (!existing) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  const stmt = db.prepare(
    `UPDATE tools
     SET
       name = COALESCE(@name, name),
       tagline = COALESCE(@tagline, tagline),
       description = COALESCE(@description, description),
       what_it_is = COALESCE(@what_it_is, what_it_is),
       who_its_for = COALESCE(@who_its_for, who_its_for),
       pros = COALESCE(@pros, pros),
       cons = COALESCE(@cons, cons),
       use_cases = COALESCE(@use_cases, use_cases),
       pricing_summary = COALESCE(@pricing_summary, pricing_summary),
       affiliate_url = COALESCE(@affiliate_url, affiliate_url),
       website_url = COALESCE(@website_url, website_url),
       image_url = COALESCE(@image_url, image_url),
       logo_url = COALESCE(@logo_url, logo_url),
       category_slug = COALESCE(@category_slug, category_slug),
       rating = COALESCE(@rating, rating),
       featured = COALESCE(@featured, featured),
       published = COALESCE(@published, published)
     WHERE id = @id`
  );

  stmt.run({
    id,
    name: body.name ?? null,
    tagline: body.tagline ?? null,
    description: body.description ?? null,
    what_it_is: body.what_it_is ?? null,
    who_its_for: body.who_its_for ?? null,
    pros: body.pros ? JSON.stringify(body.pros) : null,
    cons: body.cons ? JSON.stringify(body.cons) : null,
    use_cases: body.use_cases ? JSON.stringify(body.use_cases) : null,
    pricing_summary: body.pricing_summary ?? null,
    affiliate_url: body.affiliate_url ?? null,
    website_url: body.website_url ?? null,
    image_url: body.image_url ?? null,
    logo_url: body.logo_url ?? null,
    category_slug: body.category_slug ?? null,
    rating: body.rating ?? null,
    featured: body.featured === undefined ? null : body.featured ? 1 : 0,
    published: body.published === undefined ? null : body.published ? 1 : 0,
  });

  return NextResponse.json({ ok: true });
}
