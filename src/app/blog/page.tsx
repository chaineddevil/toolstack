/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getPosts } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function BlogPage() {
  const posts = getPosts().filter((p) => p.post_type !== "comparison");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 text-[#111]">
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
        <p className="max-w-xl text-sm text-[#666]">
          In-depth reviews, roundups, and guides to help you find the right SaaS
          tools for your workflow.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#999]">
          No posts yet. Check back soon.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white transition-shadow hover:shadow-md"
            >
              {post.featured_image && (
                <div className="aspect-[16/9] w-full overflow-hidden bg-[#f5f5f5]">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2 p-5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#999]">
                  {post.post_type === "review" ? "Review" : "Article"}
                </span>
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
      )}
    </div>
  );
}
