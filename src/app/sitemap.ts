import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();

  // Fetch all published tools and posts in parallel
  const [toolsRes, postsRes] = await Promise.all([
    supabase
      .from("tools")
      .select("slug, created_at, updated_at")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("posts")
      .select("slug, post_type, created_at, updated_at")
      .eq("published", true)
      .order("created_at", { ascending: false }),
  ]);

  const tools = toolsRes.data ?? [];
  const posts = postsRes.data ?? [];

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/tools`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/comparisons`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/submit-tool`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // Tool pages
  const toolPages: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: `${SITE_URL}/tools/${tool.slug}`,
    lastModified: new Date(tool.updated_at || tool.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Blog posts (non-comparison)
  const blogPages: MetadataRoute.Sitemap = posts
    .filter((p) => p.post_type !== "comparison")
    .map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at || post.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  // Comparisons
  const comparisonPages: MetadataRoute.Sitemap = posts
    .filter((p) => p.post_type === "comparison")
    .map((post) => ({
      url: `${SITE_URL}/comparisons/${post.slug}`,
      lastModified: new Date(post.updated_at || post.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...staticPages, ...toolPages, ...blogPages, ...comparisonPages];
}
