import { redirect } from "next/navigation";

// Treks removed — redirect to admin home
export default function AdminTreksPage() {
  redirect("/admin");
}
