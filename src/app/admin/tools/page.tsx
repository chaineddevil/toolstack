import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminToolsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/admin/login");
    }

    // Fetch tools with status
    const { data: tools } = await supabase
        .from("tools")
        .select("id, name, slug, status, category_slug, updated_at")
        .order("updated_at", { ascending: false });

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-[#111]">Tools</h1>
                    <p className="text-sm text-[#666]">Manage software directory listings.</p>
                </div>
                <Link
                    href="/admin/tools/new"
                    className="rounded-lg bg-[#111] px-4 py-2 text-sm font-medium text-white hover:bg-[#333]"
                >
                    Add New Tool
                </Link>
            </header>

            <div className="rounded-xl border border-black/5 bg-white overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#fafafa] text-[#666]">
                        <tr>
                            <th className="px-6 py-3 font-medium">Name</th>
                            <th className="px-6 py-3 font-medium">Category</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium">Last Updated</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                        {tools?.map((tool) => (
                            <tr key={tool.id} className="hover:bg-[#fafafa]">
                                <td className="px-6 py-3 font-medium text-[#111]">
                                    <div className="flex flex-col">
                                        <span>{tool.name}</span>
                                        <span className="text-xs text-[#999] font-normal">{tool.slug}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-[#666]">{tool.category_slug || "-"}</td>
                                <td className="px-6 py-3">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tool.status === "published"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : tool.status === "draft"
                                                    ? "bg-amber-100 text-amber-700"
                                                    : "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {tool.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-[#666]">
                                    {new Date(tool.updated_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <Link
                                        href={`/admin/tools/${tool.id}`}
                                        className="text-[#111] hover:underline"
                                    >
                                        Edit
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {tools?.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-[#666]">
                                    No tools found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
