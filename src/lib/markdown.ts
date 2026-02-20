import { marked } from "marked";

/**
 * Processes custom markdown syntax and renders to HTML.
 *
 * Custom syntax supported:
 *   {{image:url|alt=text|caption=text|align=center}}
 *   {{tool:slug}}
 *
 * The tool embed resolves to an inline card using the provided toolMap.
 */
export function renderCustomMarkdown(
  rawMarkdown: string,
  toolMap?: Map<string, { name: string; slug: string; tagline?: string }>
): string {
  let processed = rawMarkdown;

  // ─── Image embeds ────────────────────────────────────────────────
  // {{image:url|alt=text|caption=text|align=center}}
  processed = processed.replace(
    /\{\{image:([^|]+?)(?:\|([^}]*))?\}\}/g,
    (_: string, url: string, rest: string) => {
      const attrs: Record<string, string> = {};
      if (rest) {
        rest.split("|").forEach((pair) => {
          const [key, ...val] = pair.split("=");
          if (key && val.length) {
            attrs[key.trim()] = val.join("=").trim();
          }
        });
      }

      const alt = attrs.alt || "";
      const caption = attrs.caption || "";
      const align = attrs.align || "center";

      const alignClass =
        align === "left"
          ? "text-left"
          : align === "right"
            ? "text-right"
            : align === "full"
              ? "text-center w-full"
              : "text-center";

      return [
        `<figure class="my-6 ${alignClass}">`,
        `  <img src="${url}" alt="${alt}" class="rounded-lg max-w-full inline-block" loading="lazy" />`,
        caption
          ? `  <figcaption class="text-sm text-gray-500 mt-2">${caption}</figcaption>`
          : "",
        `</figure>`,
      ]
        .filter(Boolean)
        .join("\n");
    }
  );

  // ─── Tool embeds ─────────────────────────────────────────────────
  // {{tool:slug}}
  processed = processed.replace(
    /\{\{tool:([^}]+)\}\}/g,
    (_: string, slug: string) => {
      const trimmedSlug = slug.trim();
      const tool = toolMap?.get(trimmedSlug);

      if (tool) {
        return [
          `<div class="not-prose my-4 rounded-xl border border-black/5 bg-[#fafafa] p-4 flex items-center gap-4">`,
          `  <div class="flex-1">`,
          `    <a href="/tools/${tool.slug}" class="text-sm font-semibold text-[#111] hover:underline">${tool.name}</a>`,
          tool.tagline
            ? `    <p class="text-xs text-[#666] mt-1">${tool.tagline}</p>`
            : "",
          `  </div>`,
          `  <a href="/tools/${tool.slug}" class="shrink-0 rounded-lg bg-[#111] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#333]">View Tool &rarr;</a>`,
          `</div>`,
        ]
          .filter(Boolean)
          .join("\n");
      }

      // Fallback: tool not found
      return `<div class="not-prose my-4 rounded-xl border border-dashed border-black/10 bg-[#fafafa] p-4 text-sm text-[#999]">Tool: ${trimmedSlug} (not found)</div>`;
    }
  );

  // ─── Render markdown ─────────────────────────────────────────────
  return marked.parse(processed) as string;
}
