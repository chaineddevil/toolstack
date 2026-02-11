import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-[#111]">
      <header className="mb-10 space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          About ToolStack
        </h1>
        <p className="text-base text-[#666]">
          We help you find the right SaaS tools — without the noise.
        </p>
      </header>

      <div className="space-y-8 text-sm leading-relaxed text-[#444]">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#111]">What we do</h2>
          <p>
            ToolStack is a discovery platform for SaaS tools. We write honest
            reviews, publish detailed comparisons, and curate the best software
            for teams of every size — from solo founders to growing startups.
          </p>
          <p>
            Every tool on this site has been tested hands-on. We sign up for
            free tiers, push the limits, explore edge cases, and report back
            with clear, practical takeaways.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#111]">How we make money</h2>
          <p>
            Some links on ToolStack are affiliate links. When you sign up for a
            tool through one of these links, we may earn a small commission — at
            no extra cost to you.
          </p>
          <p>
            This is how we keep the site free and the reviews honest. We never
            let affiliate relationships influence our recommendations. If a tool
            isn&apos;t good, we say so — even if they have an affiliate program.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#111]">Our values</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[#999]">→</span>
              <span>
                <strong className="text-[#111]">Honesty over hype.</strong> We
                list cons alongside pros. No tool is perfect.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[#999]">→</span>
              <span>
                <strong className="text-[#111]">Practitioners first.</strong>{" "}
                Our reviews come from people who build products, not from
                marketing teams.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[#999]">→</span>
              <span>
                <strong className="text-[#111]">
                  Transparency always.
                </strong>{" "}
                Affiliate links are clearly disclosed. No hidden agendas.
              </span>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#111]">
            Want to be featured?
          </h2>
          <p>
            If you&apos;re building a SaaS tool and want it reviewed on
            ToolStack, we&apos;d love to hear from you.
          </p>
          <Link
            href="/submit-tool"
            className="inline-flex items-center rounded-full bg-[#111] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#333]"
          >
            Submit your tool →
          </Link>
        </section>
      </div>
    </div>
  );
}
