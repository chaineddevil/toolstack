import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getPostTools } from "@/lib/db";
import { marked } from "marked";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const html = marked.parse(post.body ?? "") as string;
  const mentionedTools = getPostTools(post.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-[#111]">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-[#999]">
        <Link href="/blog" className="hover:text-[#111]">
          Blog
        </Link>
        <span>/</span>
        <span className="text-[#666]">{post.title}</span>
      </nav>

      {/* Header */}
      <header className="mb-8 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#999]">
            {post.post_type === "review"
              ? "Tool Review"
              : post.post_type === "comparison"
                ? "Comparison"
                : "Article"}
          </span>
          {post.category_slug && (
            <>
              <span className="text-[#ccc]">·</span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#999]">
                {post.category_slug.replace("-", " & ")}
              </span>
            </>
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {post.title}
        </h1>
        {post.summary && (
          <p className="text-base text-[#666]">{post.summary}</p>
        )}
      </header>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="mb-10 overflow-hidden rounded-xl border border-black/5 bg-[#f5f5f5]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.featured_image}
            alt={post.title}
            className="h-64 w-full object-cover md:h-80"
          />
        </div>
      )}

      {/* Content Grid */}
      <div className="grid gap-10 md:grid-cols-[1fr_280px]">
        {/* Article Body */}
        <article
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Sidebar */}
        {mentionedTools.length > 0 && (
          <aside className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#999]">
              Tools Mentioned
            </h3>
            <div className="space-y-3">
              {mentionedTools.map((tool) => (
                <div
                  key={tool.id}
                  className="rounded-xl border border-black/5 bg-[#fafafa] p-4"
                >
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="text-sm font-semibold text-[#111] hover:text-[#666]"
                  >
                    {tool.name}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-xs text-[#666]">
                    {tool.tagline}
                  </p>
                  <a
                    href={tool.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex w-full items-center justify-center rounded-lg bg-[#111] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#333]"
                  >
                    Try {tool.name} →
                  </a>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#999]">
              Affiliate links. You pay the same price; we may earn a commission.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}
