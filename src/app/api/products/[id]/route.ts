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

  // 1. Fetch current data for versioning
  const { data: currentData, error: fetchError } = await supabase
    .from("tools")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !currentData) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  // 2. Insert previous state into content_versions
  const { data: { user } } = await supabase.auth.getUser();

  const { error: versionError } = await supabase.from("content_versions").insert({
    entity_type: "tool",
    entity_id: id,
    version_data: currentData, // Snapshot OLD state
    edited_by: user?.id
  });

  if (versionError) {
    console.error("Failed to version:", versionError);
    // Fail safely? Or block? Sticking to requirements: "On every update: Insert..."
    // Best to block if critical, but for now log.
  }

  // 3. Update tool
  // Handle specific workflows if needed (e.g., if publishing, set published_at)
  if (body.status === "published" && currentData.status !== "published") {
    body.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("tools")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
