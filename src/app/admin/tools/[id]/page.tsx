import ToolEditForm from "@/components/admin/ToolEditForm";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditToolPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: tool } = await supabase
        .from("tools")
        .select("*")
        .eq("id", id)
        .single();

    if (!tool) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-xl font-semibold text-[#111]">Edit Tool: {tool.name}</h1>
            </header>
            <ToolEditForm initialData={tool} />
        </div>
    );
}
