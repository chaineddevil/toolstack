import Link from "next/link";

export default function AdminHome() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 text-[#111]">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">
          ToolStack Admin
        </h1>
        <p className="text-sm text-[#666]">
          Manage tools, blog posts, and comparisons.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <AdminCard
          title="Manage Tools"
          description="Add or edit SaaS tools with reviews, pricing, and affiliate links."
          href="/admin/products"
        />
        <AdminCard
          title="Write Blog Post"
          description="Publish articles, reviews, and comparison posts."
          href="/admin/posts/new"
        />
      </div>
    </div>
  );
}

function AdminCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-xl border border-black/5 bg-[#fafafa] p-5 text-sm transition-shadow hover:shadow-md"
    >
      <h2 className="text-sm font-semibold text-[#111]">{title}</h2>
      <p className="text-xs text-[#666]">{description}</p>
      <span className="mt-1 text-xs font-medium text-[#111]">Open →</span>
    </Link>
  );
}
