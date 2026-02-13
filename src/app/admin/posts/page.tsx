import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminPostsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/admin/login");
    }

    // Fetch posts
    const { data: posts } = await supabase
        .from("posts")
        .select("id, title, slug, status, post_type, updated_at")
        .order("updated_at", { ascending: false });

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-[#111]">Posts</h1>
                    <p className="text-sm text-[#666]">Manage blog articles and guides.</p>
                </div>
                <Link
                    href="/admin/posts/new"
                    className="rounded-lg bg-[#111] px-4 py-2 text-sm font-medium text-white hover:bg-[#333]"
                >
                    Write New Post
                </Link>
            </header>

            <div className="rounded-xl border border-black/5 bg-white overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#fafafa] text-[#666]">
                        <tr>
                            <th className="px-6 py-3 font-medium">Title</th>
                            <th className="px-6 py-3 font-medium">Type</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium">Last Updated</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                        {posts?.map((post) => (
                            <tr key={post.id} className="hover:bg-[#fafafa]">
                                <td className="px-6 py-3 font-medium text-[#111]">
                                    <div className="flex flex-col">
                                        <span>{post.title}</span>
                                        <span className="text-xs text-[#999] font-normal">{post.slug}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-[#666] capitalize">{post.post_type}</td>
                                <td className="px-6 py-3">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${post.status === "published"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : post.status === "draft"
                                                    ? "bg-amber-100 text-amber-700"
                                                    : "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {post.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-[#666]">
                                    {new Date(post.updated_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <Link
                                        href={`/admin/posts/${post.id}`}
                                        className="text-[#111] hover:underline"
                                    >
                                        Edit
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {posts?.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-[#666]">
                                    No posts found. Write one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
