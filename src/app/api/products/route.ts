import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { getUserRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const role = await getUserRole();
  if (!role || !["super_admin", "manager", "editor"].includes(role)) {
    // Allow data_entry to create but with limited status? OR block?
    // Spec: "data_entry: create draft"
    if (role !== "data_entry") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  const supabase = await createClient();
  const body = await request.json();

  // Basic validation (can use Zod here too, but frontend did it)
  // Ensure data_entry created items are drafts
  if (role === "data_entry") {
    body.status = "draft";
  }

  // Set submitted_by
  const { data: { user } } = await supabase.auth.getUser();
  body.submitted_by = user?.id;

  const { data, error } = await supabase
    .from("tools")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Initial version
  await supabase.from("content_versions").insert({
    entity_type: "tool",
    entity_id: data.id,
    version_data: data,
    edited_by: user?.id
  });

  return NextResponse.json(data);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const publishedOnly = url.searchParams.get("published") === "true";

  let query = supabase.from("tools").select("*").order("name");

  if (publishedOnly) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
