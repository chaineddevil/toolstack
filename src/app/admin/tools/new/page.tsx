import ToolEditForm from "@/components/admin/ToolEditForm";

export default function NewToolPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-xl font-semibold text-[#111]">Create New Tool</h1>
            </header>
            <ToolEditForm />
        </div>
    );
}
