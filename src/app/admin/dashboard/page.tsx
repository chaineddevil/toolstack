import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  // ─── Fetch all counts in parallel ──────────────────────────────────
  const [
    { count: totalTools },
    { count: publishedTools },
    { count: totalPosts },
    { count: publishedPosts },
    { count: totalAuthors },
    { count: draftTools },
    { count: draftPosts },
    { count: toolsMissingLogo },
    { count: toolsNoAffiliate },
    { count: postsMissingMeta },
    { count: toolsMissingDesc },
    { data: recentActivity },
    { count: scheduledPosts },
  ] = await Promise.all([
    // Total counts
    supabase.from("tools").select("*", { count: "exact", head: true }),
    supabase
      .from("tools")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase.from("authors").select("*", { count: "exact", head: true }),

    // Draft counts
    supabase
      .from("tools")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),

    // Content health
    supabase
      .from("tools")
      .select("*", { count: "exact", head: true })
      .or("logo_url.is.null,logo_url.eq."),
    supabase
      .from("tools")
      .select("*", { count: "exact", head: true })
      .or("affiliate_url.is.null,affiliate_url.eq."),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .or("meta_description.is.null,meta_description.eq."),
    supabase
      .from("tools")
      .select("*", { count: "exact", head: true })
      .or("description.is.null,description.eq."),

    // Recent activity (last 10 content versions)
    supabase
      .from("content_versions")
      .select("id, entity_type, entity_id, created_at")
      .order("created_at", { ascending: false })
      .limit(10),

    // Scheduled
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "scheduled"),
  ]);

  const statCards = [
    {
      label: "Tools",
      total: totalTools || 0,
      published: publishedTools || 0,
      href: "/admin/tools",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Posts",
      total: totalPosts || 0,
      published: publishedPosts || 0,
      href: "/admin/posts",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Authors",
      total: totalAuthors || 0,
      published: null,
      href: "/admin/authors",
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Drafts",
      total: (draftTools || 0) + (draftPosts || 0),
      published: null,
      href: "/admin/posts",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const healthItems = [
    {
      label: "Tools missing logo",
      count: toolsMissingLogo || 0,
      severity: "red" as const,
    },
    {
      label: "Tools missing affiliate link",
      count: toolsNoAffiliate || 0,
      severity: "amber" as const,
    },
    {
      label: "Posts missing meta description",
      count: postsMissingMeta || 0,
      severity: "amber" as const,
    },
    {
      label: "Tools missing description",
      count: toolsMissingDesc || 0,
      severity: "red" as const,
    },
    {
      label: "Scheduled posts",
      count: scheduledPosts || 0,
      severity: "blue" as const,
    },
  ];

  const severityColors = {
    red: "text-red-600 bg-red-50",
    amber: "text-amber-600 bg-amber-50",
    blue: "text-blue-600 bg-blue-50",
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-[#111]">Dashboard</h1>
        <p className="text-sm text-[#666]">
          Overview of content and system health.
        </p>
      </header>

      {/* ─── Count Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="block rounded-xl border border-black/5 bg-white p-6 hover:shadow-sm transition-shadow"
          >
            <h3 className="text-sm font-medium text-[#666]">{card.label}</h3>
            <p className={`mt-2 text-3xl font-bold ${card.color}`}>
              {card.total}
            </p>
            {card.published !== null && (
              <p className="mt-1 text-xs text-[#999]">
                {card.published} published
              </p>
            )}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* ─── Quick Actions ──────────────────────────────────────── */}
        <div className="rounded-xl border border-black/5 bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-3">
            {[
              { label: "Add New Tool", href: "/admin/tools/new" },
              { label: "Write New Post", href: "/admin/posts/new" },
              { label: "Add Author", href: "/admin/authors/new" },
              { label: "Record Transaction", href: "/admin/ledger/new" },
              { label: "Site Settings", href: "/admin/settings" },
              { label: "Manage Media", href: "/admin/media" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center justify-between p-3 rounded-lg bg-[#fafafa] hover:bg-[#f0f0f0] transition-colors"
              >
                <span className="text-sm font-medium">{action.label}</span>
                <span className="text-xs text-[#666]">&rarr;</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ─── Content Health ─────────────────────────────────────── */}
        <div className="rounded-xl border border-black/5 bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Content Health</h2>
          <div className="space-y-3">
            {healthItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 rounded-lg bg-[#fafafa]"
              >
                <span className="text-sm text-[#666]">{item.label}</span>
                <span
                  className={`text-sm font-bold px-2 py-0.5 rounded-full ${severityColors[item.severity]}`}
                >
                  {item.count}
                </span>
              </div>
            ))}
            {healthItems.every((h) => h.count === 0) && (
              <p className="text-sm text-emerald-600 font-medium text-center py-4">
                All content looks healthy!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Recent Activity ──────────────────────────────────────── */}
      <div className="rounded-xl border border-black/5 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {recentActivity && recentActivity.length > 0 ? (
          <div className="space-y-2">
            {recentActivity.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[#fafafa] text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      entry.entity_type === "post"
                        ? "bg-emerald-100 text-emerald-700"
                        : entry.entity_type === "tool"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {entry.entity_type}
                  </span>
                  <span className="text-[#666]">
                    {entry.entity_type.charAt(0).toUpperCase() +
                      entry.entity_type.slice(1)}{" "}
                    #{entry.entity_id} updated
                  </span>
                </div>
                <span className="text-xs text-[#999]">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#999] text-center py-4">
            No recent activity yet.
          </p>
        )}
      </div>
    </div>
  );
}
