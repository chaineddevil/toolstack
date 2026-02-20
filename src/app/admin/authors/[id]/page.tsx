import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import AuthorEditForm from "@/components/admin/AuthorEditForm";

export const dynamic = "force-dynamic";

export default async function EditAuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: author } = await supabase
    .from("authors")
    .select("*")
    .eq("id", id)
    .single();

  if (!author) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Edit Author</h1>
      <AuthorEditForm
        initialData={{
          id: author.id,
          name: author.name,
          slug: author.slug,
          bio: author.bio || "",
          headshot_url: author.headshot_url || "",
          expertise_areas: (author.expertise_areas as string[]) || [],
          social_profiles: (author.social_profiles as {
            twitter?: string;
            linkedin?: string;
            youtube?: string;
          }) || {},
        }}
      />
    </div>
  );
}
