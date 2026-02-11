/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getCategories, getTools, getToolsByCategory, getCategoryBySlug } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ category?: string }>;
}

export default async function ToolsPage({ searchParams }: Props) {
  const params = await searchParams;
  const categorySlug = params.category;

  const categories = getCategories();
  const activeCategory = categorySlug
    ? getCategoryBySlug(categorySlug)
    : undefined;
  const tools = categorySlug
    ? getToolsByCategory(categorySlug)
    : getTools();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 text-[#111]">
      {/* Header */}
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {activeCategory ? activeCategory.name : "All Tools"}
        </h1>
        <p className="max-w-xl text-sm text-[#666]">
          {activeCategory
            ? activeCategory.description
            : "Curated SaaS tools reviewed and tested by practitioners. Filter by category or browse the full collection."}
        </p>
      </header>

      {/* Category Pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/tools"
          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
            !categorySlug
              ? "border-[#111] bg-[#111] text-white"
              : "border-black/10 text-[#666] hover:border-black/30 hover:text-[#111]"
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/tools?category=${cat.slug}`}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              categorySlug === cat.slug
                ? "border-[#111] bg-[#111] text-white"
                : "border-black/10 text-[#666] hover:border-black/30 hover:text-[#111]"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Tool Grid */}
      {tools.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#999]">
          No tools found in this category yet.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white transition-shadow hover:shadow-md"
            >
              <div className="aspect-[16/9] w-full overflow-hidden bg-[#f5f5f5]">
                <img
                  src={tool.image_url}
                  alt={tool.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#999]">
                    {categories.find((c) => c.slug === tool.category_slug)?.name ??
                      tool.category_slug}
                  </span>
                  {tool.rating && (
                    <span className="text-xs font-medium text-[#666]">
                      ★ {tool.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-[#111] group-hover:text-[#666]">
                  {tool.name}
                </h3>
                <p className="line-clamp-2 text-xs text-[#666]">
                  {tool.tagline}
                </p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="text-xs text-[#999]">
                    {tool.pricing_summary.split(".")[0]}
                  </span>
                  <span className="text-xs font-medium text-[#111]">
                    View review →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
