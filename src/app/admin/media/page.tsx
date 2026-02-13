"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";

type MediaAsset = {
    id: number;
    file_path: string;
    alt_text: string | null;
    created_at: string;
};

export default function MediaLibraryPage() {
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [uploading, setUploading] = useState(false);

    async function loadAssets() {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // In a real implementation this would fetch from `media_assets` table
        // For now, listing directly from storage bucket for MVP
        const { data, error } = await supabase.storage.from("public-assets").list();
        if (data) {
            setAssets(data.map((f, i) => ({
                id: i,
                file_path: f.name,
                alt_text: f.name,
                created_at: f.created_at
            })));
        }
    }

    useEffect(() => {
        loadAssets();
    }, []);

    async function onUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error } = await supabase.storage
            .from("public-assets")
            .upload(filePath, file);

        if (error) {
            alert("Upload failed: " + error.message);
        } else {
            // Here we would insert into media_assets table
            await loadAssets();
        }
        setUploading(false);
    }

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-[#111]">Media Library</h1>
                    <p className="text-sm text-[#666]">Manage images and files.</p>
                </div>
                <label className="cursor-pointer rounded-lg bg-[#111] px-4 py-2 text-sm font-medium text-white hover:bg-[#333]">
                    {uploading ? "Uploading..." : "Upload File"}
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={onUpload}
                        disabled={uploading}
                    />
                </label>
            </header>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {assets.map((asset) => (
                    <div
                        key={asset.id}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-black/5 bg-[#fafafa]"
                    >
                        <Image
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-assets/${asset.file_path}`}
                            alt={asset.alt_text || "Media"}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                            <p className="truncate">{asset.file_path}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
