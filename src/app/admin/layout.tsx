"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { useUserRole, type UserRole } from "@/hooks/use-user-role";

// Navigation Items Configuration
const NAV_ITEMS = [
    {
        label: "Dashboard",
        href: "/admin",
        roles: ["all"],
        icon: "LayoutDashboard",
    },
    {
        label: "Tools",
        href: "/admin/tools",
        roles: ["super_admin", "manager", "editor", "data_entry"],
        icon: "Wrench",
    },
    {
        label: "Posts",
        href: "/admin/posts",
        roles: ["super_admin", "manager", "editor"],
        icon: "FileText",
    },
    {
        label: "Media",
        href: "/admin/media",
        roles: ["super_admin", "manager", "editor"],
        icon: "Image",
    },
    {
        label: "Tags",
        href: "/admin/tags",
        roles: ["super_admin", "manager", "editor"],
        icon: "Tags",
    },
    {
        label: "Workflow",
        href: "/admin/workflow",
        roles: ["super_admin", "manager", "reviewer"],
        icon: "GitPullRequest",
    },
    {
        label: "Ledger",
        href: "/admin/ledger",
        roles: ["super_admin", "manager"],
        icon: "DollarSign",
    },
    {
        label: "Settings",
        href: "/admin/settings",
        roles: ["super_admin"],
        icon: "Settings",
    },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { role, loading } = useUserRole();
    const pathname = usePathname();

    // If on login page, render without layout
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-sm text-[#666]">
                Loading permissions...
            </div>
        );
    }

    if (!role) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 text-[#111]">
                <h1 className="text-xl font-semibold">Access Denied</h1>
                <p className="text-sm text-[#666]">
                    You do not have the required permissions to view this area.
                </p>
                <Link
                    href="/"
                    className="rounded-lg bg-[#111] px-4 py-2 text-sm font-medium text-white hover:bg-[#333]"
                >
                    Return Home
                </Link>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#f9fafb]">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-64 border-r border-black/5 bg-white">
                <div className="flex h-14 items-center border-b border-black/5 px-6">
                    <Link href="/admin" className="font-semibold tracking-tight">
                        ToolStack Admin
                    </Link>
                    <span className="ml-auto rounded-full bg-black/5 px-2 py-0.5 text-[10px] uppercase font-medium text-[#666]">
                        {role?.replace("_", " ")}
                    </span>
                </div>

                <nav className="p-4 space-y-1">
                    {NAV_ITEMS.filter(
                        (item) => item.roles.includes("all") || item.roles.includes(role)
                    ).map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                                        ? "bg-[#111] text-white"
                                        : "text-[#666] hover:bg-black/5 hover:text-[#111]"
                                    }`}
                            >
                                {/* Icon placeholder (using text for now to avoid lucide deps) */}
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-4 left-4 right-4 border-t border-black/5 pt-4">
                    <form action="/api/auth/signout" method="post">
                        <button className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                            Sign Out
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 p-8">
                <div className="mx-auto max-w-6xl">{children}</div>
            </main>
        </div>
    );
}
