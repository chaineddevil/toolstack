import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

// Old product page — redirects to the new tool review page
export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/tools/${slug}`);
}
