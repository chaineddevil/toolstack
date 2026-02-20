/**
 * SEO utilities — shared constants and helpers for metadata, JSON-LD, and OG images.
 */

// ─── Site-wide constants ────────────────────────────────────────────────────

export const SITE_URL = "https://sahyai.com";
export const SITE_NAME = "SAHYAI";
export const SITE_TAGLINE = "Discover the Best SaaS Tools";
export const DEFAULT_DESCRIPTION =
  "Honest reviews, real comparisons, and curated recommendations for the best SaaS tools to build, grow, and automate your work.";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const BUCKET = "public-assets";

// ─── Image URL helper ───────────────────────────────────────────────────────

/** Resolve an image to its full public URL (Supabase Storage path or external URL). */
export function resolveImageUrl(
  storagePath?: string | null,
  fallbackUrl?: string | null
): string | null {
  if (storagePath) {
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
  }
  return fallbackUrl ?? null;
}

// ─── Canonical URL helper ───────────────────────────────────────────────────

/** Build an absolute URL from a path segment. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// ─── JSON-LD helpers ────────────────────────────────────────────────────────

/** Organization schema — used in root layout and BreadcrumbList. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.svg`,
    description: DEFAULT_DESCRIPTION,
    sameAs: [] as string[],
  };
}

/** WebSite schema with search action. */
export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
  };
}

/** BreadcrumbList schema. */
export function breadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Article schema for blog posts. */
export function articleJsonLd(opts: {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  datePublished: string;
  dateModified?: string | null;
  authorName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    url: opts.url,
    ...(opts.image && { image: opts.image }),
    datePublished: opts.datePublished,
    ...(opts.dateModified && { dateModified: opts.dateModified }),
    author: {
      "@type": "Person",
      name: opts.authorName ?? SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      ...(opts.image && { logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.svg` } }),
    },
  };
}

/** Product + Review schema for tool pages. */
export function toolReviewJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  image?: string | null;
  rating?: number | null;
  pros?: string[];
  cons?: string[];
  pricingSummary?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    ...(opts.image && { image: opts.image }),
    ...(opts.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: opts.rating,
        bestRating: 5,
        worstRating: 1,
        ratingCount: 1,
      },
    }),
    review: {
      "@type": "Review",
      author: { "@type": "Organization", name: SITE_NAME },
      ...(opts.rating && {
        reviewRating: {
          "@type": "Rating",
          ratingValue: opts.rating,
          bestRating: 5,
          worstRating: 1,
        },
      }),
      ...(opts.pros &&
        opts.pros.length > 0 && {
          positiveNotes: {
            "@type": "ItemList",
            itemListElement: opts.pros.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: p,
            })),
          },
        }),
      ...(opts.cons &&
        opts.cons.length > 0 && {
          negativeNotes: {
            "@type": "ItemList",
            itemListElement: opts.cons.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: c,
            })),
          },
        }),
    },
    ...(opts.pricingSummary && {
      offers: {
        "@type": "Offer",
        description: opts.pricingSummary,
        priceCurrency: "USD",
      },
    }),
  };
}

/** FAQPage schema. */
export function faqPageJsonLd(
  items: { question: string; answer: string }[]
) {
  if (!items || items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
