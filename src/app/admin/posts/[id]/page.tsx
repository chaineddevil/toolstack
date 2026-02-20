import PostEditForm from "@/components/admin/PostEditForm";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { ToolAssignment } from "@/lib/schemas/post";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch all data in parallel
  const [
    { data: post },
    { data: authors },
    { data: categories },
    { data: tools },
    { data: postCategories },
    { data: postTools },
    { data: allPosts },
  ] = await Promise.all([
    supabase.from("posts").select("*").eq("id", id).single(),
    supabase.from("authors").select("id, name").order("name"),
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase
      .from("tools")
      .select("id, name, slug")
      .eq("status", "published")
      .order("name"),
    supabase
      .from("post_categories")
      .select("category_id")
      .eq("post_id", id),
    supabase
      .from("post_tools")
      .select(
        "tool_id, sort_order, caption, short_editorial, rating, pros, cons, who_its_for, verdict_badge, testing_notes"
      )
      .eq("post_id", id)
      .order("sort_order"),
    supabase
      .from("posts")
      .select("slug, title")
      .eq("status", "published")
      .neq("id", id)
      .order("title"),
  ]);

  if (!post) {
    notFound();
  }

  // Map post DB columns back to form fields
  const initialData = {
    ...post,
    content: post.body || "",
    image_url: post.featured_image || "",
    faq_items: post.faq_items || [],
    secondary_keywords: post.secondary_keywords || [],
  };

  // Extract category IDs
  const initialCategoryIds = (postCategories || []).map(
    (pc: { category_id: number }) => pc.category_id
  );

  // Valid verdict badge values
  const VERDICT_BADGES = [
    "best_overall",
    "best_budget",
    "most_unique",
    "editors_choice",
    "best_value",
    "",
  ] as const;

  // Map post_tools to tool_assignments format
  const initialToolAssignments: ToolAssignment[] = (postTools || []).map(
    (pt: {
      tool_id: number;
      sort_order: number;
      caption: string | null;
      short_editorial: string | null;
      rating: number | null;
      pros: string[] | null;
      cons: string[] | null;
      who_its_for: string | null;
      verdict_badge: string | null;
      testing_notes: string | null;
    }) => {
      const rawBadge = pt.verdict_badge || "";
      const badge = (VERDICT_BADGES as readonly string[]).includes(rawBadge)
        ? (rawBadge as ToolAssignment["verdict_badge"])
        : ("" as const);
      return {
        tool_id: pt.tool_id,
        sort_order: pt.sort_order || 0,
        caption: pt.caption || "",
        short_editorial: pt.short_editorial || "",
        rating: pt.rating ?? undefined,
        pros: pt.pros || [],
        cons: pt.cons || [],
        who_its_for: pt.who_its_for || "",
        verdict_badge: badge,
        testing_notes: pt.testing_notes || "",
      };
    }
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-[#111]">Edit Post</h1>
      </header>
      <PostEditForm
        initialData={initialData}
        authors={authors || []}
        categories={categories || []}
        tools={tools || []}
        posts={allPosts || []}
        initialCategoryIds={initialCategoryIds}
        initialToolAssignments={initialToolAssignments}
      />
    </div>
  );
}
