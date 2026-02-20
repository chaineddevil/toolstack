import PostEditForm from "@/components/admin/PostEditForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewPostPage() {
  const supabase = await createClient();

  // Fetch supporting data in parallel
  const [
    { data: authors },
    { data: categories },
    { data: tools },
    { data: allPosts },
  ] = await Promise.all([
    supabase.from("authors").select("id, name").order("name"),
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase
      .from("tools")
      .select("id, name, slug")
      .eq("status", "published")
      .order("name"),
    supabase
      .from("posts")
      .select("slug, title")
      .eq("status", "published")
      .order("title"),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-[#111]">Write New Post</h1>
      </header>
      <PostEditForm
        authors={authors || []}
        categories={categories || []}
        tools={tools || []}
        posts={allPosts || []}
      />
    </div>
  );
}
