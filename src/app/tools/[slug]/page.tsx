/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import Link from "next/link";
import { getToolBySlug, getCategoryBySlug } from "@/lib/db";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ToolReviewPage({ params }: Props) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const pros = tool.pros as string[];
  const cons = tool.cons as string[];
  const useCases = tool.use_cases as string[];
  const category = await getCategoryBySlug(tool.category_slug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-[#111]">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-[#999]">
        <Link href="/tools" className="hover:text-[#111]">
          Tools
        </Link>
        <span>/</span>
        {category && (
          <>
            <Link
              href={`/tools?category=${category.slug}`}
              className="hover:text-[#111]"
            >
              {category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-[#666]">{tool.name}</span>
      </nav>

      {/* Hero */}
      <header className="mb-10">
        <div className="flex items-start gap-4 md:items-center">
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {tool.name}
            </h1>
            <p className="text-base text-[#666]">{tool.tagline}</p>
            <div className="flex items-center gap-4 pt-1">
              {tool.rating && (
                <span className="text-sm font-medium text-[#111]">
                  ★ {tool.rating.toFixed(1)} / 5
                </span>
              )}
              {category && (
                <Link
                  href={`/tools?category=${category.slug}`}
                  className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-medium text-[#666] hover:border-black/30"
                >
                  {category.name}
                </Link>
              )}
            </div>
          </div>
        </div>

        {tool.image_url && (
          <div className="mt-6 overflow-hidden rounded-xl border border-black/5 bg-[#f5f5f5]">
            <img
              src={tool.image_url}
              alt={tool.name}
              className="h-64 w-full object-cover md:h-80"
            />
          </div>
        )}
      </header>

      {/* Content Grid */}
      <div className="grid gap-10 md:grid-cols-[1fr_300px]">
        <div className="space-y-10">
          {/* What It Is */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">What it is</h2>
            <p className="text-sm leading-relaxed text-[#444]">
              {tool.what_it_is}
            </p>
          </section>

          {/* Who It's For */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Who it&apos;s for</h2>
            <p className="text-sm leading-relaxed text-[#444]">
              {tool.who_its_for}
            </p>
          </section>

          {/* Pros & Cons */}
          <section className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="mb-3 text-lg font-semibold text-emerald-700">
                Pros
              </h2>
              <ul className="space-y-2">
                {pros.map((pro, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-[#444]"
                  >
                    <span className="mt-0.5 text-emerald-600">+</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-lg font-semibold text-red-700">Cons</h2>
              <ul className="space-y-2">
                {cons.map((con, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-[#444]"
                  >
                    <span className="mt-0.5 text-red-500">−</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Best Use Cases */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Best use cases</h2>
            <ul className="space-y-2">
              {useCases.map((uc, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-[#444]"
                >
                  <span className="mt-0.5 text-[#999]">→</span>
                  {uc}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* CTA Card */}
          <div className="rounded-xl border border-black/5 bg-[#fafafa] p-6">
            <h3 className="text-sm font-semibold">Pricing</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#444]">
              {tool.pricing_summary}
            </p>
            <a
              href={tool.affiliate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center rounded-lg bg-[#111] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#333]"
            >
              Try {tool.name} →
            </a>
            <p className="mt-3 text-center text-[11px] text-[#999]">
              Free tier available. Affiliate link.
            </p>
          </div>

          {/* Quick Facts */}
          <div className="rounded-xl border border-black/5 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold">Quick facts</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-[#999]">
                  Category
                </dt>
                <dd className="text-[#444]">{category?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-[#999]">
                  Rating
                </dt>
                <dd className="text-[#444]">
                  {tool.rating ? `${tool.rating.toFixed(1)} / 5` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-[#999]">
                  Website
                </dt>
                <dd>
                  <a
                    href={tool.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#111] underline underline-offset-2 hover:text-[#666]"
                  >
                    {tool.website_url.replace(/^https?:\/\//, "")}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
