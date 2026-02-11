import Link from "next/link";
import { getPostsByType } from "@/lib/db";
import StorageImage from "@/components/StorageImage";

export const dynamic = "force-dynamic";

export default async function ComparisonsPage() {
  const comparisons = await getPostsByType("comparison");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 text-[#111]">
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Comparisons</h1>
        <p className="max-w-xl text-sm text-[#666]">
          Side-by-side breakdowns of popular SaaS tools. We compare features,
          pricing, and use cases so you can make an informed choice.
        </p>
      </header>

      {comparisons.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#999]">
          No comparisons published yet. Check back soon.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {comparisons.map((post) => (
            <Link
              key={post.id}
              href={`/comparisons/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white transition-shadow hover:shadow-md"
            >
              {(post.featured_image_path || post.featured_image) && (
                <div className="relative aspect-[2/1] w-full overflow-hidden bg-[#f5f5f5]">
                  <StorageImage
                    storagePath={post.featured_image_path}
                    fallbackUrl={post.featured_image}
                    alt={post.title}
                    width={600}
                    height={300}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2 p-5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#999]">
                  Comparison
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
                  Read comparison →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
