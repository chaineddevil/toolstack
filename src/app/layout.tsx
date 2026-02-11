import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ToolStack — Discover the Best SaaS Tools",
  description:
    "Honest reviews, real comparisons, and curated recommendations for the best SaaS tools to build, grow, and automate your work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-[#111] antialiased">
        <div className="flex min-h-screen flex-col">
          {/* ── Header ── */}
          <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur-sm">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-tight">
                  ToolStack
                </span>
              </Link>

              <nav className="hidden items-center gap-6 text-[13px] font-medium text-[#444] md:flex">
                <Link href="/tools" className="transition-colors hover:text-[#111]">
                  Tools
                </Link>
                <Link href="/blog" className="transition-colors hover:text-[#111]">
                  Blog
                </Link>
                <Link
                  href="/comparisons"
                  className="transition-colors hover:text-[#111]"
                >
                  Comparisons
                </Link>
                <Link href="/about" className="transition-colors hover:text-[#111]">
                  About
                </Link>
                <Link
                  href="/submit-tool"
                  className="rounded-full border border-[#111] px-3.5 py-1.5 text-[12px] font-medium text-[#111] transition-colors hover:bg-[#111] hover:text-white"
                >
                  Submit a Tool
                </Link>
              </nav>

              {/* Mobile nav toggle — simple menu for now */}
              <nav className="flex items-center gap-3 text-[12px] md:hidden">
                <Link href="/tools" className="font-medium text-[#444]">
                  Tools
                </Link>
                <Link href="/blog" className="font-medium text-[#444]">
                  Blog
                </Link>
                <Link
                  href="/submit-tool"
                  className="rounded-full border border-[#111] px-3 py-1 font-medium text-[#111]"
                >
                  Submit
                </Link>
              </nav>
            </div>
          </header>

          {/* ── Main ── */}
          <main className="flex-1">{children}</main>

          {/* ── Floating Quiz CTA ── */}
          <Link
            href="/quiz"
            className="fixed bottom-5 right-5 z-40 hidden items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-medium text-[#444] shadow-lg transition-all hover:border-black/25 hover:text-[#111] hover:shadow-xl sm:inline-flex"
          >
            <span>✦</span>
            <span>Not sure what you need? Take the quiz</span>
          </Link>

          {/* ── Footer ── */}
          <footer className="border-t border-black/5 bg-[#fafafa]">
            <div className="mx-auto max-w-6xl px-4 py-10">
              <div className="grid gap-8 text-sm md:grid-cols-4">
                {/* Brand */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold tracking-tight text-[#111]">
                    ToolStack
                  </p>
                  <p className="text-xs leading-relaxed text-[#666]">
                    Honest reviews and real comparisons of the best SaaS tools.
                    Built by practitioners, not marketers.
                  </p>
                </div>

                {/* Browse */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#999]">
                    Browse
                  </p>
                  <div className="flex flex-col gap-2 text-xs text-[#666]">
                    <Link href="/tools" className="hover:text-[#111]">
                      All Tools
                    </Link>
                    <Link href="/blog" className="hover:text-[#111]">
                      Blog
                    </Link>
                    <Link href="/comparisons" className="hover:text-[#111]">
                      Comparisons
                    </Link>
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#999]">
                    Categories
                  </p>
                  <div className="flex flex-col gap-2 text-xs text-[#666]">
                    <Link href="/tools?category=no-code" className="hover:text-[#111]">
                      No-Code Tools
                    </Link>
                    <Link
                      href="/tools?category=ai-automation"
                      className="hover:text-[#111]"
                    >
                      AI &amp; Automation
                    </Link>
                    <Link
                      href="/tools?category=design-ux"
                      className="hover:text-[#111]"
                    >
                      Design &amp; UX
                    </Link>
                    <Link
                      href="/tools?category=developer"
                      className="hover:text-[#111]"
                    >
                      Developer Tools
                    </Link>
                  </div>
                </div>

                {/* Company */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#999]">
                    Company
                  </p>
                  <div className="flex flex-col gap-2 text-xs text-[#666]">
                    <Link href="/about" className="hover:text-[#111]">
                      About
                    </Link>
                    <Link href="/submit-tool" className="hover:text-[#111]">
                      Submit a Tool
                    </Link>
                    <Link href="/admin/login" className="hover:text-[#111]">
                      Admin
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-black/5 pt-6 text-[11px] text-[#999]">
                <p>
                  Some links on this site are affiliate links. We may earn a
                  commission if you sign up through our links — at no extra cost
                  to you. This helps us keep the site running and the reviews
                  honest.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
