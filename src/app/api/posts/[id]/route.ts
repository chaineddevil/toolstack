import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { getUserRole } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const role = await getUserRole();

  if (!role || !["super_admin", "manager", "editor"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = await createClient();
  const body = await request.json();

  // 1. Fetch current for versioning
  const { data: currentData } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (!currentData) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // 2. Version
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("content_versions").insert({
    entity_type: "post",
    entity_id: id,
    version_data: currentData,
    edited_by: user?.id
  });

  // 3. Update
  if (body.status === "published" && currentData.status !== "published") {
    body.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("posts")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
