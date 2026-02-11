import { redirect } from "next/navigation";

// Reels removed — redirect to admin home
export default function AdminReelsPage() {
  redirect("/admin");
}
