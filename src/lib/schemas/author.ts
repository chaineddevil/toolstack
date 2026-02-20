import { z } from "zod";

export const authorSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  bio: z.string().optional(),
  headshot_url: z.string().optional(),
  expertise_areas: z.array(z.string()).optional(),
  social_profiles: z
    .object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      youtube: z.string().optional(),
    })
    .optional(),
});

export type AuthorFormData = z.infer<typeof authorSchema>;
