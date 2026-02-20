import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { getUserRole } from "@/lib/auth";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const role = await getUserRole();
  if (role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = await createClient();
  const body = await request.json();

  // Only allow known fields to be updated
  const allowedFields = [
    "site_name",
    "site_tagline",
    "logo_url",
    "favicon_url",
    "default_meta_title",
    "default_meta_description",
    "default_og_image",
    "featured_tool_slugs",
    "featured_post_slugs",
    "social_links",
    "ftc_disclosure",
    "custom_scripts",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from("site_settings")
    .update(updateData)
    .eq("id", 1)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
