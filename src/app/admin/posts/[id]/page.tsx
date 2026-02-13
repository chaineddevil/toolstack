import PostEditForm from "@/components/admin/PostEditForm";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: post } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();

    if (!post) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-xl font-semibold text-[#111]">Edit Post</h1>
            </header>
            <PostEditForm initialData={post} />
        </div>
    );
}
