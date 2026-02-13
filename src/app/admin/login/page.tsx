"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !user) {
      setError(authError?.message || "Login failed");
      setLoading(false);
      return;
    }

    // Check if user has an admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData) {
      await supabase.auth.signOut();
      setError("Access denied. You are not an authorized admin.");
      setLoading(false);
      return;
    }

    router.refresh(); // Refresh middleware/layout state
    router.push("/admin");
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 text-[#111]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-5 rounded-xl border border-black/5 bg-white p-6"
      >
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Admin Login</h1>
          <p className="text-xs text-[#666]">
            Sign in to manage tools and blog content.
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-[#111] focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-[#111] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#111] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
