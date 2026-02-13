import { z } from "zod";

export const toolSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters"),
    tagline: z.string().optional(),
    description: z.string().optional(),
    what_it_is: z.string().optional(),
    who_its_for: z.string().optional(),
    pricing_summary: z.string().optional(),
    affiliate_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    website_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    image_url: z.string().optional(),
    category_slug: z.string().optional(),

    // New CMS Fields
    status: z.enum(["draft", "needs_review", "approved", "scheduled", "published", "archived"]),
    meta_title: z.string().max(60, "Meta Title too long").optional(),
    meta_description: z.string().max(160, "Meta Description too long").optional(),
    canonical_url: z.string().url().optional().or(z.literal("")),
    is_indexed: z.boolean().default(true),

    // JSONB fields (handled as arrays of strings for simplicity in form)
    pros: z.array(z.string()).optional(),
    cons: z.array(z.string()).optional(),
    use_cases: z.array(z.string()).optional(),
});

export type ToolFormData = z.infer<typeof toolSchema>;
