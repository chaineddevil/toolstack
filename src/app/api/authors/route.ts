import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { getUserRole } from "@/lib/auth";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("authors")
    .select("*, posts(count)")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const role = await getUserRole();
  if (!role || !["super_admin", "manager", "editor"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("authors")
    .insert({
      name: body.name,
      slug: body.slug,
      bio: body.bio || "",
      headshot_url: body.headshot_url || null,
      expertise_areas: body.expertise_areas || [],
      social_profiles: body.social_profiles || {},
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
