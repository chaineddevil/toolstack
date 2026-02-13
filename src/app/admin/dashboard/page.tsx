import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/admin/login");

    // Content Health Metrics
    const { count: toolsMissingLogo } = await supabase
        .from("tools")
        .select("*", { count: "exact", head: true })
        .or("logo_url.is.null,logo_url.eq.");

    const { count: toolsNoAffiliate } = await supabase
        .from("tools")
        .select("*", { count: "exact", head: true })
        .or("affiliate_url.is.null,affiliate_url.eq.");

    const { count: pendingDrafts } = await supabase
        .from("tools")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft");

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-xl font-semibold text-[#111]">Dashboard</h1>
                <p className="text-sm text-[#666]">Overview of content and system health.</p>
            </header>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/admin/tools" className="block rounded-xl border border-black/5 bg-white p-6 hover:shadow-sm transition-shadow">
                    <h3 className="text-sm font-medium text-[#666]">Missing Logo</h3>
                    <p className="mt-2 text-3xl font-bold text-red-600">{toolsMissingLogo || 0}</p>
                </Link>
                <Link href="/admin/tools" className="block rounded-xl border border-black/5 bg-white p-6 hover:shadow-sm transition-shadow">
                    <h3 className="text-sm font-medium text-[#666]">No Affiliate Link</h3>
                    <p className="mt-2 text-3xl font-bold text-amber-600">{toolsNoAffiliate || 0}</p>
                </Link>
                <Link href="/admin/tools" className="block rounded-xl border border-black/5 bg-white p-6 hover:shadow-sm transition-shadow">
                    <h3 className="text-sm font-medium text-[#666]">Pending Drafts</h3>
                    <p className="mt-2 text-3xl font-bold text-[#111]">{pendingDrafts || 0}</p>
                </Link>
                <Link href="/admin/ledger" className="block rounded-xl border border-black/5 bg-white p-6 hover:shadow-sm transition-shadow">
                    <h3 className="text-sm font-medium text-[#666]">Ledger System</h3>
                    <p className="mt-2 text-sm font-medium text-emerald-600">View Revenue →</p>
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="rounded-xl border border-black/5 bg-white p-6">
                    <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="grid gap-4">
                        <Link href="/admin/tools/new" className="flex items-center justify-between p-3 rounded-lg bg-[#fafafa] hover:bg-[#f0f0f0]">
                            <span className="text-sm font-medium">Add New Tool</span>
                            <span className="text-xs text-[#666]">→</span>
                        </Link>
                        <Link href="/admin/posts/new" className="flex items-center justify-between p-3 rounded-lg bg-[#fafafa] hover:bg-[#f0f0f0]">
                            <span className="text-sm font-medium">Write New Post</span>
                            <span className="text-xs text-[#666]">→</span>
                        </Link>
                        <Link href="/admin/ledger/new" className="flex items-center justify-between p-3 rounded-lg bg-[#fafafa] hover:bg-[#f0f0f0]">
                            <span className="text-sm font-medium">Record Transaction</span>
                            <span className="text-xs text-[#666]">→</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
