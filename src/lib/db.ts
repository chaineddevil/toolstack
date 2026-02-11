// ToolStack — Supabase data layer
// All functions are async and use the Supabase client.

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Tool = {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  what_it_is: string;
  who_its_for: string;
  pros: string[];
  cons: string[];
  use_cases: string[];
  pricing_summary: string;
  affiliate_url: string;
  website_url: string;
  image_url: string;
  logo_url: string;
  category_slug: string;
  rating: number | null;
  featured: boolean;
  published: boolean;
  created_at: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number;
};

export type Post = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  featured_image: string | null;
  post_type: "article" | "review" | "comparison";
  category_slug: string | null;
  published: boolean;
  created_at: string;
  updated_at: string | null;
};

export type PostTool = {
  post_id: number;
  tool_id: number;
  sort_order: number | null;
};

// ─── Query Functions ─────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | undefined> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();
  return data ?? undefined;
}

export async function getTools(): Promise<Tool[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tools")
    .select("*")
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getToolsByCategory(
  categorySlug: string
): Promise<Tool[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tools")
    .select("*")
    .eq("published", true)
    .eq("category_slug", categorySlug)
    .order("featured", { ascending: false })
    .order("rating", { ascending: false });
  return data ?? [];
}

export async function getToolBySlug(slug: string): Promise<Tool | undefined> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tools")
    .select("*")
    .eq("slug", slug)
    .single();
  return data ?? undefined;
}

export async function getFeaturedTools(): Promise<Tool[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tools")
    .select("*")
    .eq("published", true)
    .eq("featured", true)
    .order("rating", { ascending: false })
    .limit(6);
  return data ?? [];
}

export async function getPosts(): Promise<Post[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPostsByType(postType: string): Promise<Post[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .eq("post_type", postType)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .single();
  return data ?? undefined;
}

export async function getPostTools(postId: number): Promise<Tool[]> {
  const supabase = await createClient();
  const { data: links } = await supabase
    .from("post_tools")
    .select("tool_id, sort_order")
    .eq("post_id", postId)
    .order("sort_order", { ascending: true });

  if (!links || links.length === 0) return [];

  const toolIds = links.map((l) => l.tool_id);
  const { data: tools } = await supabase
    .from("tools")
    .select("*")
    .in("id", toolIds);

  if (!tools) return [];

  // Preserve sort order from post_tools
  const byId = new Map(tools.map((t) => [t.id, t]));
  return toolIds.map((id) => byId.get(id)).filter(Boolean) as Tool[];
}

export async function getFeaturedPosts(limit = 3): Promise<Post[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getToolsBySlugs(slugs: string[]): Promise<Tool[]> {
  if (slugs.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("tools")
    .select("*")
    .in("slug", slugs)
    .eq("published", true);

  if (!data) return [];
  // Preserve input order
  const bySlug = new Map(data.map((t) => [t.slug, t]));
  return slugs.map((s) => bySlug.get(s)).filter(Boolean) as Tool[];
}

export async function getPostsBySlugs(slugs: string[]): Promise<Post[]> {
  if (slugs.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .in("slug", slugs)
    .eq("published", true);

  if (!data) return [];
  const bySlug = new Map(data.map((p) => [p.slug, p]));
  return slugs.map((s) => bySlug.get(s)).filter(Boolean) as Post[];
}

export async function saveQuizResponse(data: {
  role: string;
  goals: string[];
  technical: string;
  budget: string;
  workflow: string;
  top_pick_slug: string;
}): Promise<number> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("quiz_responses")
    .insert({
      role: data.role,
      goals: data.goals,
      technical: data.technical,
      budget: data.budget,
      workflow: data.workflow,
      top_pick_slug: data.top_pick_slug,
    })
    .select("id")
    .single();

  if (error) throw error;
  return row?.id ?? 0;
}
