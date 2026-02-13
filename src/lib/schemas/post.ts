import { z } from "zod";

export const postSchema = z.object({
    id: z.number().optional(),
    title: z.string().min(2, "Title must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters"),
    summary: z.string().optional(),
    content: z.string().optional(), // Markdown body
    image_url: z.string().optional(),
    post_type: z.enum(["article", "review", "comparison"]).default("article"),
    category_slug: z.string().optional(),

    // CMS Fields
    status: z.enum(["draft", "needs_review", "approved", "scheduled", "published", "archived"]),
    meta_title: z.string().max(60).optional(),
    meta_description: z.string().max(160).optional(),
    canonical_url: z.string().url().optional().or(z.literal("")),
    is_indexed: z.boolean().default(true),

    // Relations (handled separately usually, but can be part of form state)
    tool_ids: z.array(z.number()).optional(),
});

export type PostFormData = z.infer<typeof postSchema>;
