import { z } from "zod";

// Tool assignment schema (enriched post_tools junction)
const toolAssignmentSchema = z.object({
  tool_id: z.number(),
  sort_order: z.number().optional(),
  caption: z.string().optional(),
  short_editorial: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  who_its_for: z.string().optional(),
  verdict_badge: z
    .enum([
      "best_overall",
      "best_budget",
      "most_unique",
      "editors_choice",
      "best_value",
      "",
    ])
    .optional(),
  testing_notes: z.string().optional(),
});

// FAQ item schema
const faqItemSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});

export const postSchema = z.object({
  id: z.number().optional(),

  // Section 1: Post Details
  title: z.string().min(2, "Title must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  summary: z.string().optional(),
  image_url: z.string().optional(),
  featured_image_alt: z.string().optional(),
  content: z.string().optional(),
  post_type: z.enum([
    "article",
    "review",
    "comparison",
    "guide",
    "roundup",
    "news",
  ]),
  blog_type: z
    .enum(["standard", "listicle", "hub", "editorial"])
    .optional(),
  sort_order: z.number().optional(),
  status: z.enum([
    "draft",
    "needs_review",
    "approved",
    "scheduled",
    "published",
    "archived",
  ]),
  show_in_nav: z.boolean().optional(),
  nav_label: z.string().optional(),
  nav_position: z.number().optional(),

  // Section 2: Author & Publishing
  author_id: z.number().nullable().optional(),
  publish_date: z.string().optional(),

  // Section 3: SEO Metadata
  meta_title: z.string().max(60, "Meta title too long").optional(),
  meta_description: z
    .string()
    .max(160, "Meta description too long")
    .optional(),
  primary_keyword: z.string().optional(),
  search_intent: z
    .enum(["informational", "transactional", "navigational", "commercial"])
    .optional(),
  secondary_keywords: z.array(z.string()).optional(),
  canonical_url: z.string().url().optional().or(z.literal("")),
  og_image: z.string().optional(),
  is_indexed: z.boolean(),

  // Section 4: Categories
  category_slug: z.string().optional(), // legacy single category
  category_ids: z.array(z.number()).optional(), // new multi-category

  // Section 5: FAQ Items
  faq_items: z.array(faqItemSchema).optional(),

  // Section 7: Assigned Tools (with editorial enrichment)
  tool_assignments: z.array(toolAssignmentSchema).optional(),

  // Legacy field (kept for backwards compat)
  tool_ids: z.array(z.number()).optional(),
});

export type PostFormData = z.infer<typeof postSchema>;
export type ToolAssignment = z.infer<typeof toolAssignmentSchema>;
export type FaqItem = z.infer<typeof faqItemSchema>;
