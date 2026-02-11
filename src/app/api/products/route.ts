import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Repurposed: now serves the "tools" table instead of "products"

export async function GET() {
  const db = getDb();
  const tools = db
    .prepare(
      "SELECT * FROM tools ORDER BY created_at DESC"
    )
    .all();
  return NextResponse.json(tools);
}

export async function POST(request: NextRequest) {
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
  };

  if (!body.name || !body.description || !body.affiliate_url) {
    return NextResponse.json(
      { error: "name, description, and affiliate_url are required" },
      { status: 400 }
    );
  }

  const db = getDb();

  const slugBase = body.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = slugBase || "tool";
  let suffix = 1;
  while (
    db.prepare("SELECT 1 FROM tools WHERE slug = ?").get(slug) as
      | { 1: number }
      | undefined
  ) {
    slug = `${slugBase}-${suffix++}`;
  }

  const stmt = db.prepare(
    `INSERT INTO tools (name, slug, tagline, description, what_it_is, who_its_for, pros, cons, use_cases, pricing_summary, affiliate_url, website_url, image_url, logo_url, category_slug, rating, featured)
     VALUES (@name, @slug, @tagline, @description, @what_it_is, @who_its_for, @pros, @cons, @use_cases, @pricing_summary, @affiliate_url, @website_url, @image_url, @logo_url, @category_slug, @rating, @featured)`
  );

  const res = stmt.run({
    name: body.name,
    slug,
    tagline: body.tagline ?? "",
    description: body.description,
    what_it_is: body.what_it_is ?? "",
    who_its_for: body.who_its_for ?? "",
    pros: JSON.stringify(body.pros ?? []),
    cons: JSON.stringify(body.cons ?? []),
    use_cases: JSON.stringify(body.use_cases ?? []),
    pricing_summary: body.pricing_summary ?? "",
    affiliate_url: body.affiliate_url,
    website_url: body.website_url ?? "",
    image_url: body.image_url ?? "",
    logo_url: body.logo_url ?? "",
    category_slug: body.category_slug ?? "",
    rating: body.rating ?? null,
    featured: body.featured ? 1 : 0,
  });

  return NextResponse.json({ id: res.lastInsertRowid, slug });
}
