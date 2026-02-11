import Link from "next/link";
import { getCategories, getFeaturedPosts, getPosts } from "@/lib/db";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS: Record<string, string> = {
  puzzle: "🧩",
  sparkles: "✨",
  palette: "🎨",
  megaphone: "📣",
  code: "💻",
  briefcase: "📋",
};

export default async function HomePage() {
  const categories = await getCategories();
  const featuredPosts = await getFeaturedPosts(3);
  const latestPosts = await getPosts();

  return (
    <div className="bg-white text-[#111]">
      {/* ── Hero ── */}
      <section className="border-b border-black/5">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="max-w-2xl space-y-5">
            <h1 className="text-3xl font-semibold tracking-tight md:text-[2.75rem] md:leading-[1.15]">
              Discover the best tools to build, grow, and automate your work
            </h1>
            <p className="text-base text-[#666]">
              Honest reviews. Real use cases. No fluff.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/quiz"
                className="inline-flex items-center rounded-full bg-[#111] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#333]"
              >
                Find my perfect tools
              </Link>
              <Link
                href="/tools"
                className="inline-flex items-center rounded-full border border-black/15 px-5 py-2.5 text-sm font-medium text-[#444] transition-colors hover:border-black/30 hover:text-[#111]"
              >
                Browse Tools
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 1: Featured Articles ── */}
      <section className="border-b border-black/5">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#999]">
              Featured Articles
            </h2>
            <Link
              href="/blog"
              className="text-xs font-medium text-[#666] transition-colors hover:text-[#111]"
            >
              View all articles →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featuredPosts.map((post) => (
              <Link
                key={post.id}
                href={
                  post.post_type === "comparison"
                    ? `/comparisons/${post.slug}`
                    : `/blog/${post.slug}`
                }
                className="group flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white transition-shadow hover:shadow-md"
              >
                {post.featured_image && (
                  <div className="aspect-[16/9] w-full overflow-hidden bg-[#f5f5f5]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#999]">
                    {post.post_type === "comparison"
                      ? "Comparison"
                      : post.category_slug?.replace("-", " & ") ?? "Article"}
                  </span>
                  <h3 className="text-base font-semibold leading-snug text-[#111] group-hover:text-[#666]">
                    {post.title}
                  </h3>
                  {post.summary && (
                    <p className="line-clamp-2 text-sm text-[#666]">
                      {post.summary}
                    </p>
                  )}
                  <span className="mt-auto pt-2 text-xs font-medium text-[#111]">
                    Read article →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 2: Tool Categories ── */}
      <section className="border-b border-black/5 bg-[#fafafa]">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#999]">
              Browse by Category
            </h2>
            <Link
              href="/tools"
              className="text-xs font-medium text-[#666] transition-colors hover:text-[#111]"
            >
              All tools →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/tools?category=${cat.slug}`}
                className="group flex items-start gap-4 rounded-xl border border-black/5 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <span className="text-2xl">
                  {CATEGORY_ICONS[cat.icon] ?? "📦"}
                </span>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-[#111] group-hover:text-[#666]">
                    {cat.name}
                  </h3>
                  <p className="line-clamp-2 text-xs text-[#666]">
                    {cat.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Latest Posts ── */}
      <section className="border-b border-black/5">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#999]">
              Latest Posts
            </h2>
            <Link
              href="/blog"
              className="text-xs font-medium text-[#666] transition-colors hover:text-[#111]"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {latestPosts.map((post) => (
              <Link
                key={post.id}
                href={
                  post.post_type === "comparison"
                    ? `/comparisons/${post.slug}`
                    : `/blog/${post.slug}`
                }
                className="group flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white transition-shadow hover:shadow-md"
              >
                {post.featured_image && (
                  <div className="aspect-[16/9] w-full overflow-hidden bg-[#f5f5f5]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[#999]">
                      {post.post_type === "comparison"
                        ? "Comparison"
                        : post.post_type === "review"
                          ? "Review"
                          : "Article"}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold leading-snug text-[#111] group-hover:text-[#666]">
                    {post.title}
                  </h3>
                  {post.summary && (
                    <p className="line-clamp-2 text-xs text-[#666]">
                      {post.summary}
                    </p>
                  )}
                  <span className="mt-auto pt-2 text-xs font-medium text-[#111]">
                    Read review →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Trust Block ── */}
      <section className="bg-[#fafafa]">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: "🛠",
                title: "Curated by practitioners",
                desc: "Every tool is evaluated by people who actually use them — not by algorithms or ad spend.",
              },
              {
                icon: "🧪",
                title: "Hands-on tested",
                desc: "We sign up, use the free tier, push the limits, and report back honestly.",
              },
              {
                icon: "🤝",
                title: "Affiliate transparency",
                desc: "Some links earn us a commission at no cost to you. This keeps the site running and the reviews independent.",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <span className="text-2xl">{item.icon}</span>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-[#111]">
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#666]">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
