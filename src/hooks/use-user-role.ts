"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";

export type UserRole = "super_admin" | "manager" | "editor" | "reviewer" | "data_entry" | null;

export function useUserRole() {
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRole() {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setRole(null);
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", user.id)
                .single();

            setRole((data?.role as UserRole) ?? null);
            setLoading(false);
        }

        fetchRole();
    }, []);

    return { role, loading };
}
