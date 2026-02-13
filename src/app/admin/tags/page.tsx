"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";

type Tag = {
    id: number;
    name: string;
    slug: string;
};

export default function TagsPage() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function loadTags() {
        const { data } = await supabase.from("tags").select("*").order("name");
        if (data) setTags(data);
    }

    useEffect(() => {
        loadTags();
    }, []);

    async function onAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

        const { error } = await supabase.from("tags").insert({ name, slug });

        if (error) {
            alert("Error adding tag: " + error.message);
        } else {
            setName("");
            loadTags();
        }
        setLoading(false);
    }

    async function onDelete(id: number) {
        if (!confirm("Are you sure?")) return;
        await supabase.from("tags").delete().eq("id", id);
        loadTags();
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-xl font-semibold text-[#111]">Tags</h1>
                <p className="text-sm text-[#666]">Manage taxonomy for tools and posts.</p>
            </header>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* List */}
                <div className="rounded-xl border border-black/5 bg-white overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#fafafa] text-[#666]">
                            <tr>
                                <th className="px-6 py-3 font-medium">Name</th>
                                <th className="px-6 py-3 font-medium">Slug</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {tags.map(tag => (
                                <tr key={tag.id} className="hover:bg-[#fafafa]">
                                    <td className="px-6 py-3 font-medium">{tag.name}</td>
                                    <td className="px-6 py-3 text-[#666]">{tag.slug}</td>
                                    <td className="px-6 py-3 text-right">
                                        <button onClick={() => onDelete(tag.id)} className="text-red-600 hover:text-red-800">Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {tags.length === 0 && <tr><td colSpan={3} className="px-6 py-4 text-center text-[#666]">No tags.</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* Add Form */}
                <div>
                    <form onSubmit={onAdd} className="bg-white p-6 rounded-xl border border-black/5 space-y-4 max-w-sm ml-auto">
                        <h3 className="font-semibold">Add New Tag</h3>
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                placeholder="e.g. SEO Tools"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#111] text-white py-2 rounded-lg font-medium hover:bg-[#333] disabled:opacity-50"
                        >
                            {loading ? "Adding..." : "Add Tag"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
