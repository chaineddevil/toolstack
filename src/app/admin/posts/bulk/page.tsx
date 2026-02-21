import BulkUploadForm from "@/components/admin/BulkUploadForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function BulkUploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Fetch supporting data in parallel
  const [{ data: categories }, { data: authors }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase.from("authors").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-[#111]">
          Bulk Upload Posts
        </h1>
        <p className="mt-1 text-sm text-[#666]">
          Upload up to 50 posts at once via a JSON file.
        </p>
      </header>
      <BulkUploadForm
        categories={categories || []}
        authors={authors || []}
      />
    </div>
  );
}
