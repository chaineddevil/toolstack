import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getPostTools } from "@/lib/db";
import { marked } from "marked";
import StorageImage from "@/components/StorageImage";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.post_type !== "comparison") {
    notFound();
  }

  const html = marked.parse(post.body ?? "") as string;
  const comparedTools = await getPostTools(post.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-[#111]">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-[#999]">
        <Link href="/comparisons" className="hover:text-[#111]">
          Comparisons
        </Link>
        <span>/</span>
        <span className="text-[#666]">{post.title}</span>
      </nav>

      {/* Header */}
      <header className="mb-8 space-y-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#999]">
          Comparison
        </span>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {post.title}
        </h1>
        {post.summary && (
          <p className="text-base text-[#666]">{post.summary}</p>
        )}
      </header>

      {/* Featured Image */}
      {(post.featured_image_path || post.featured_image) && (
        <div className="relative mb-10 overflow-hidden rounded-xl border border-black/5 bg-[#f5f5f5]" style={{ height: "320px" }}>
          <StorageImage
            storagePath={post.featured_image_path}
            fallbackUrl={post.featured_image}
            alt={post.title}
            width={900}
            height={320}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 900px"
            priority
          />
        </div>
      )}

      {/* Compared Tools Strip */}
      {comparedTools.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-3">
          {comparedTools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}`}
              className="flex items-center gap-2 rounded-full border border-black/10 bg-[#fafafa] px-4 py-2 text-xs font-medium text-[#444] transition-colors hover:border-black/30 hover:text-[#111]"
            >
              <span>{tool.name}</span>
              {tool.rating && (
                <span className="text-[#999]">★ {tool.rating.toFixed(1)}</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Article Body */}
      <article
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* CTA Strip */}
      {comparedTools.length > 0 && (
        <section className="mt-12 rounded-xl border border-black/5 bg-[#fafafa] p-6">
          <h3 className="mb-4 text-sm font-semibold">
            Try the tools mentioned in this comparison
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {comparedTools.map((tool) => (
              <a
                key={tool.id}
                href={tool.affiliate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-lg bg-[#111] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#333]"
              >
                Try {tool.name} →
              </a>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[#999]">
            Affiliate links. You pay the same price; we may earn a commission.
          </p>
        </section>
      )}
    </div>
  );
}
