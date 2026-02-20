import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Fetch current settings
  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  // Default values if no settings row exists yet
  const initialData = {
    site_name: settings?.site_name || "SAHYAI",
    site_tagline: settings?.site_tagline || "",
    logo_url: settings?.logo_url || "",
    favicon_url: settings?.favicon_url || "",
    default_meta_title: settings?.default_meta_title || "",
    default_meta_description: settings?.default_meta_description || "",
    default_og_image: settings?.default_og_image || "",
    featured_tool_slugs: settings?.featured_tool_slugs || [],
    featured_post_slugs: settings?.featured_post_slugs || [],
    social_links: settings?.social_links || {
      twitter: "",
      linkedin: "",
      youtube: "",
      github: "",
    },
    ftc_disclosure: settings?.ftc_disclosure || "",
    custom_scripts: settings?.custom_scripts || {
      head: "",
      body_start: "",
      body_end: "",
    },
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-[#111]">Site Settings</h1>
        <p className="text-sm text-[#666]">
          Manage branding, SEO defaults, and social links.
        </p>
      </header>
      <SiteSettingsForm initialData={initialData} />
    </div>
  );
}
