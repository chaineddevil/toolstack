import { redirect } from "next/navigation";

// Old store page — redirects to the new tools listing
export default function StorePage() {
  redirect("/tools");
}
