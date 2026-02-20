import { z } from "zod";

export const settingsSchema = z.object({
  // Branding
  site_name: z.string().min(1, "Site name is required"),
  site_tagline: z.string().optional(),
  logo_url: z.string().optional(),
  favicon_url: z.string().optional(),

  // SEO Defaults
  default_meta_title: z.string().max(60, "Meta title too long").optional(),
  default_meta_description: z
    .string()
    .max(160, "Meta description too long")
    .optional(),
  default_og_image: z.string().optional(),

  // Featured Content (arrays of slugs)
  featured_tool_slugs: z.array(z.string()).optional(),
  featured_post_slugs: z.array(z.string()).optional(),

  // Social Links
  social_links: z
    .object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      youtube: z.string().optional(),
      github: z.string().optional(),
    })
    .optional(),

  // Compliance
  ftc_disclosure: z.string().optional(),

  // Custom Scripts
  custom_scripts: z
    .object({
      head: z.string().optional(),
      body_start: z.string().optional(),
      body_end: z.string().optional(),
    })
    .optional(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
