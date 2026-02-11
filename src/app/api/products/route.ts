import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Repurposed: now serves the "tools" table instead of "products"

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tools")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
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

  const supabase = createAdminClient();

  // Generate unique slug
  const slugBase = body.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = slugBase || "tool";
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: existing } = await supabase
      .from("tools")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${slugBase}-${suffix++}`;
  }

  const { data: newTool, error } = await supabase
    .from("tools")
    .insert({
      name: body.name,
      slug,
      tagline: body.tagline ?? "",
      description: body.description,
      what_it_is: body.what_it_is ?? "",
      who_its_for: body.who_its_for ?? "",
      pros: body.pros ?? [],
      cons: body.cons ?? [],
      use_cases: body.use_cases ?? [],
      pricing_summary: body.pricing_summary ?? "",
      affiliate_url: body.affiliate_url,
      website_url: body.website_url ?? "",
      image_url: body.image_url ?? "",
      logo_url: body.logo_url ?? "",
      category_slug: body.category_slug ?? "",
      rating: body.rating ?? null,
      featured: body.featured ?? false,
    })
    .select("id, slug")
    .single();

  if (error || !newTool) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ id: newTool.id, slug: newTool.slug });
}
