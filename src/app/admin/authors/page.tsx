import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AuthorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: authors } = await supabase
    .from("authors")
    .select("*")
    .order("name");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Authors</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage blog post authors and their profiles.
          </p>
        </div>
        <Link
          href="/admin/authors/new"
          className="bg-[#111] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#333]"
        >
          + New Author
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Expertise</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {authors && authors.length > 0 ? (
              authors.map((author) => (
                <tr
                  key={author.id}
                  className="border-b border-black/5 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {author.headshot_url ? (
                        <img
                          src={author.headshot_url}
                          alt={author.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                          {author.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium">{author.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{author.slug}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(author.expertise_areas as string[])?.map(
                        (area: string) => (
                          <span
                            key={area}
                            className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {area}
                          </span>
                        )
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/authors/${author.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                  No authors yet. Create your first author.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
