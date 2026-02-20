import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPostBySlug, getPostTools } from "@/lib/db";
import { renderCustomMarkdown } from "@/lib/markdown";
import StorageImage from "@/components/StorageImage";
import {
  SITE_NAME,
  absoluteUrl,
  resolveImageUrl,
  articleJsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
} from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

// ─── Dynamic Metadata ───────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const ext = post as Record<string, unknown>;
  const title = (ext.meta_title as string) || post.title;
  const description =
    (ext.meta_description as string) ||
    post.summary ||
    `Read our ${post.post_type === "review" ? "review" : "article"}: ${post.title}`;
  const canonical =
    (ext.canonical_url as string) || absoluteUrl(`/blog/${slug}`);
  const image = resolveImageUrl(
    (ext.og_image as string) || post.featured_image_path,
    post.featured_image
  );

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      ...(image && { images: [{ url: image, width: 1200, height: 630 }] }),
      publishedTime: post.created_at,
      ...(post.updated_at && { modifiedTime: post.updated_at }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const mentionedTools = await getPostTools(post.id);

  // Build tool map for custom markdown rendering
  const toolMap = new Map(
    mentionedTools.map((t) => [
      t.slug,
      { name: t.name, slug: t.slug, tagline: t.tagline },
    ])
  );
  const html = renderCustomMarkdown(post.body ?? "", toolMap);

  // Resolve image for JSON-LD
  const image = resolveImageUrl(post.featured_image_path, post.featured_image);
  const pageUrl = absoluteUrl(`/blog/${slug}`);

  // FAQ items from DB (v3 column)
  const faqItems = (post as Record<string, unknown>).faq_items as
    | { question: string; answer: string }[]
    | null;

  // JSON-LD schemas
  const articleLd = articleJsonLd({
    title: post.title,
    description: post.summary || post.title,
    url: pageUrl,
    image,
    datePublished: post.created_at,
    dateModified: post.updated_at,
  });

  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Blog", url: absoluteUrl("/blog") },
    { name: post.title, url: pageUrl },
  ]);

  const faqLd = faqItems && faqItems.length > 0 ? faqPageJsonLd(faqItems) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-[#111]">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

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

      {/* Content Grid */}
      <div className="grid gap-10 md:grid-cols-[1fr_280px]">
        {/* Article Body */}
        <div>
          <article
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* FAQ Section */}
          {faqItems && faqItems.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-6 text-lg font-semibold">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqItems.map((faq, i) => (
                  <details
                    key={i}
                    className="group rounded-xl border border-black/5 bg-[#fafafa]"
                  >
                    <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-[#111] transition-colors hover:text-[#666]">
                      {faq.question}
                    </summary>
                    <div className="border-t border-black/5 px-5 py-4 text-sm leading-relaxed text-[#444]">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>

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
