"use client";

import { useState, type FormEvent } from "react";

export default function SubmitToolPage() {
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // In production, this would POST to an API endpoint
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-[#111]">
        <div className="space-y-3">
          <p className="text-3xl">✓</p>
          <h1 className="text-xl font-semibold">Thanks for submitting!</h1>
          <p className="text-sm text-[#666]">
            We&apos;ll review your tool and get back to you if it&apos;s a good
            fit for ToolStack. Most reviews are published within 2 weeks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 text-[#111]">
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Submit a Tool
        </h1>
        <p className="text-sm text-[#666]">
          Building a SaaS product? Tell us about it. We review every submission
          and publish honest, hands-on reviews for tools that make the cut.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label
            htmlFor="tool_name"
            className="text-xs font-medium text-[#111]"
          >
            Tool name *
          </label>
          <input
            id="tool_name"
            name="tool_name"
            type="text"
            required
            placeholder="e.g. Notion, Webflow, Zapier"
            className="w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-[#111] placeholder:text-[#ccc] focus:border-[#111] focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="website_url"
            className="text-xs font-medium text-[#111]"
          >
            Website URL *
          </label>
          <input
            id="website_url"
            name="website_url"
            type="url"
            required
            placeholder="https://yourapp.com"
            className="w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-[#111] placeholder:text-[#ccc] focus:border-[#111] focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="category"
            className="text-xs font-medium text-[#111]"
          >
            Category *
          </label>
          <select
            id="category"
            name="category"
            required
            className="w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-[#111] focus:border-[#111] focus:outline-none"
          >
            <option value="">Select a category</option>
            <option value="no-code">No-Code Tools</option>
            <option value="ai-automation">AI &amp; Automation</option>
            <option value="design-ux">Design &amp; UX</option>
            <option value="marketing">Marketing Tools</option>
            <option value="developer">Developer Tools</option>
            <option value="business-productivity">
              Business &amp; Productivity
            </option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="tagline"
            className="text-xs font-medium text-[#111]"
          >
            One-line description *
          </label>
          <input
            id="tagline"
            name="tagline"
            type="text"
            required
            placeholder="What does your tool do in one sentence?"
            className="w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-[#111] placeholder:text-[#ccc] focus:border-[#111] focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="details"
            className="text-xs font-medium text-[#111]"
          >
            Anything else we should know?
          </label>
          <textarea
            id="details"
            name="details"
            rows={4}
            placeholder="Pricing, special features, what makes it different..."
            className="w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-[#111] placeholder:text-[#ccc] focus:border-[#111] focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-medium text-[#111]">
            Your email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="hello@yourcompany.com"
            className="w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-[#111] placeholder:text-[#ccc] focus:border-[#111] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-[#111] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#333]"
        >
          Submit for Review
        </button>

        <p className="text-[11px] text-[#999]">
          Submitting does not guarantee a review. We evaluate every tool on its
          merits and only publish reviews for tools we genuinely recommend.
        </p>
      </form>
    </div>
  );
}
