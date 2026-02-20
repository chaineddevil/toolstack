import ToolEditForm from "@/components/admin/ToolEditForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewToolPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-[#111]">Create New Tool</h1>
      </header>
      <ToolEditForm categories={categories || []} />
    </div>
  );
}
