import PostEditForm from "@/components/admin/PostEditForm";

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-[#111]">Write New Post</h1>
      </header>
      <PostEditForm />
    </div>
  );
}
