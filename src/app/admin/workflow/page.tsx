import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function WorkflowPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/admin/login");
    }

    // Fetch items needing review
    const { data: tools } = await supabase
        .from("tools")
        .select("id, name, updated_at, submitted_by")
        .eq("status", "needs_review")
        .order("updated_at", { ascending: false });

    const { data: posts } = await supabase
        .from("posts")
        .select("id, title, updated_at, submitted_by")
        .eq("status", "needs_review")
        .order("updated_at", { ascending: false });

    const hasItems = (tools?.length ?? 0) > 0 || (posts?.length ?? 0) > 0;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-xl font-semibold text-[#111]">Workflow</h1>
                <p className="text-sm text-[#666]">Review and approve pending content.</p>
            </header>

            {!hasItems ? (
                <div className="rounded-xl border border-black/5 bg-white p-6">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        </div>
                        <h3 className="text-sm font-medium text-[#111]">All Caught Up</h3>
                        <p className="mt-1 text-sm text-[#666]">
                            There are no items currently waiting for review.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Tools needing review */}
                    {tools && tools.length > 0 && (
                        <section>
                            <h2 className="text-sm font-medium mb-3">Tools ({tools.length})</h2>
                            <div className="rounded-xl border border-black/5 bg-white overflow-hidden">
                                <div className="divide-y divide-black/5">
                                    {tools.map((tool) => (
                                        <div key={tool.id} className="flex items-center justify-between p-4 hover:bg-[#fafafa]">
                                            <div>
                                                <h3 className="text-sm font-medium text-[#111]">{tool.name}</h3>
                                                <p className="text-xs text-[#666]">Submitted {new Date(tool.updated_at).toLocaleDateString()}</p>
                                            </div>
                                            <Link
                                                href={`/admin/tools/${tool.id}`}
                                                className="text-xs font-medium bg-[#111] text-white px-3 py-1.5 rounded-md hover:bg-[#333]"
                                            >
                                                Review
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Posts needing review */}
                    {posts && posts.length > 0 && (
                        <section>
                            <h2 className="text-sm font-medium mb-3">Posts ({posts.length})</h2>
                            <div className="rounded-xl border border-black/5 bg-white overflow-hidden">
                                <div className="divide-y divide-black/5">
                                    {posts.map((post) => (
                                        <div key={post.id} className="flex items-center justify-between p-4 hover:bg-[#fafafa]">
                                            <div>
                                                <h3 className="text-sm font-medium text-[#111]">{post.title}</h3>
                                                <p className="text-xs text-[#666]">Submitted {new Date(post.updated_at).toLocaleDateString()}</p>
                                            </div>
                                            <Link
                                                href={`/admin/posts/${post.id}`}
                                                className="text-xs font-medium bg-[#111] text-white px-3 py-1.5 rounded-md hover:bg-[#333]"
                                            >
                                                Review
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
