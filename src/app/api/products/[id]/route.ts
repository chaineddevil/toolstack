import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const supabase = createAdminClient();

  // Check existence
  const { data: existing } = await supabase
    .from("tools")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  // Build update object — only include provided fields
  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.tagline !== undefined) update.tagline = body.tagline;
  if (body.description !== undefined) update.description = body.description;
  if (body.what_it_is !== undefined) update.what_it_is = body.what_it_is;
  if (body.who_its_for !== undefined) update.who_its_for = body.who_its_for;
  if (body.pros !== undefined) update.pros = body.pros;
  if (body.cons !== undefined) update.cons = body.cons;
  if (body.use_cases !== undefined) update.use_cases = body.use_cases;
  if (body.pricing_summary !== undefined) update.pricing_summary = body.pricing_summary;
  if (body.affiliate_url !== undefined) update.affiliate_url = body.affiliate_url;
  if (body.website_url !== undefined) update.website_url = body.website_url;
  if (body.image_url !== undefined) update.image_url = body.image_url;
  if (body.logo_url !== undefined) update.logo_url = body.logo_url;
  if (body.category_slug !== undefined) update.category_slug = body.category_slug;
  if (body.rating !== undefined) update.rating = body.rating;
  if (body.featured !== undefined) update.featured = body.featured;
  if (body.published !== undefined) update.published = body.published;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("tools").update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
