"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useController, type Control } from "react-hook-form";

interface MarkdownEditorProps {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  control: Control<any>;
  name: string;
  label?: string;
  posts?: Array<{ slug: string; title: string }>;
  tools?: Array<{ slug: string; name: string }>;
}

// ─── Toolbar Actions ─────────────────────────────────────────────────────────

type InsertAction = {
  label: string;
  icon: string;
  action: "wrap" | "prefix" | "insert" | "modal";
  before?: string;
  after?: string;
  text?: string;
  modalType?: "image" | "link" | "tool";
};

const TOOLBAR_ACTIONS: InsertAction[] = [
  { label: "Bold", icon: "B", action: "wrap", before: "**", after: "**" },
  { label: "Italic", icon: "I", action: "wrap", before: "*", after: "*" },
  { label: "H2", icon: "H2", action: "prefix", before: "## " },
  { label: "H3", icon: "H3", action: "prefix", before: "### " },
  { label: "Quote", icon: "❝", action: "prefix", before: "> " },
  { label: "List", icon: "•", action: "prefix", before: "- " },
  { label: "HR", icon: "—", action: "insert", text: "\n---\n" },
  { label: "Image", icon: "🖼", action: "modal", modalType: "image" },
  { label: "Link", icon: "🔗", action: "modal", modalType: "link" },
  { label: "Tool", icon: "⚙", action: "modal", modalType: "tool" },
];

// ─── Image Modal ─────────────────────────────────────────────────────────────

function ImageModal({
  onInsert,
  onClose,
}: {
  onInsert: (md: string) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [align, setAlign] = useState("center");

  function handleInsert() {
    if (!url) return;
    const parts = [`{{image:${url}`];
    if (alt) parts.push(`alt=${alt}`);
    if (caption) parts.push(`caption=${caption}`);
    if (align !== "center") parts.push(`align=${align}`);
    onInsert(parts.join("|") + "}}");
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
        <h4 className="font-semibold text-lg">Insert Image</h4>
        <div>
          <label className="block text-sm font-medium mb-1">Image URL *</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Alt Text</label>
          <input value={alt} onChange={(e) => setAlt(e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="Description of image" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Caption</label>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="Optional caption" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Alignment</label>
          <div className="flex gap-2">
            {["left", "center", "right", "full"].map((a) => (
              <button key={a} type="button" onClick={() => setAlign(a)} className={`px-3 py-1 text-xs rounded-full border ${align === a ? "bg-[#111] text-white border-[#111]" : "border-gray-200 hover:bg-gray-50"}`}>
                {a}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={handleInsert} disabled={!url} className="px-4 py-2 text-sm bg-[#111] text-white rounded-lg hover:bg-[#333] disabled:opacity-50">Insert</button>
        </div>
      </div>
    </div>
  );
}

// ─── Link Modal ──────────────────────────────────────────────────────────────

function LinkModal({
  posts,
  onInsert,
  onClose,
}: {
  posts?: Array<{ slug: string; title: string }>;
  onInsert: (md: string) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"internal" | "external">("internal");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("");

  function handleInsert() {
    if (mode === "internal" && selectedSlug) {
      const post = posts?.find((p) => p.slug === selectedSlug);
      onInsert(`[${text || post?.title || selectedSlug}](/blog/${selectedSlug})`);
    } else if (mode === "external" && url) {
      onInsert(`[${text || url}](${url})`);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
        <h4 className="font-semibold text-lg">Insert Link</h4>
        <div className="flex gap-2">
          <button type="button" onClick={() => setMode("internal")} className={`px-3 py-1 text-xs rounded-full border ${mode === "internal" ? "bg-[#111] text-white border-[#111]" : "border-gray-200 hover:bg-gray-50"}`}>
            Internal Post
          </button>
          <button type="button" onClick={() => setMode("external")} className={`px-3 py-1 text-xs rounded-full border ${mode === "external" ? "bg-[#111] text-white border-[#111]" : "border-gray-200 hover:bg-gray-50"}`}>
            External URL
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Link Text</label>
          <input value={text} onChange={(e) => setText(e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="Click here" />
        </div>
        {mode === "internal" ? (
          <div>
            <label className="block text-sm font-medium mb-1">Select Post</label>
            <select value={selectedSlug} onChange={(e) => setSelectedSlug(e.target.value)} className="w-full p-2 border rounded-lg text-sm">
              <option value="">Choose a post...</option>
              {posts?.map((p) => (
                <option key={p.slug} value={p.slug}>{p.title}</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="https://..." />
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={handleInsert} className="px-4 py-2 text-sm bg-[#111] text-white rounded-lg hover:bg-[#333]">Insert</button>
        </div>
      </div>
    </div>
  );
}

// ─── Tool Embed Modal ────────────────────────────────────────────────────────

function ToolModal({
  tools,
  onInsert,
  onClose,
}: {
  tools?: Array<{ slug: string; name: string }>;
  onInsert: (md: string) => void;
  onClose: () => void;
}) {
  const [selectedSlug, setSelectedSlug] = useState("");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
        <h4 className="font-semibold text-lg">Embed Tool Card</h4>
        <div>
          <label className="block text-sm font-medium mb-1">Select Tool</label>
          <select value={selectedSlug} onChange={(e) => setSelectedSlug(e.target.value)} className="w-full p-2 border rounded-lg text-sm">
            <option value="">Choose a tool...</option>
            {tools?.map((t) => (
              <option key={t.slug} value={t.slug}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={() => { if (selectedSlug) { onInsert(`{{tool:${selectedSlug}}}`); onClose(); } }} disabled={!selectedSlug} className="px-4 py-2 text-sm bg-[#111] text-white rounded-lg hover:bg-[#333] disabled:opacity-50">Insert</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Editor ─────────────────────────────────────────────────────────────

export default function MarkdownEditor({
  control,
  name,
  label = "Content",
  posts,
  tools,
}: MarkdownEditorProps) {
  const { field } = useController({ control, name });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [modal, setModal] = useState<"image" | "link" | "tool" | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");

  // Lazy-load marked for preview
  useEffect(() => {
    if (!showPreview) return;
    import("marked").then(({ marked }) => {
      const raw = field.value || "";
      // Pre-process custom syntax for preview
      const processed = raw
        .replace(
          /\{\{image:([^|]+?)(?:\|([^}]*))?\}\}/g,
          (_: string, url: string, rest: string) => {
            const attrs = Object.fromEntries(
              (rest || "").split("|").map((p: string) => {
                const [k, ...v] = p.split("=");
                return [k, v.join("=")];
              })
            );
            return `<figure style="text-align:${attrs.align || "center"}"><img src="${url}" alt="${attrs.alt || ""}" style="max-width:100%;border-radius:8px;" />${attrs.caption ? `<figcaption style="font-size:0.85em;color:#666;margin-top:4px;">${attrs.caption}</figcaption>` : ""}</figure>`;
          }
        )
        .replace(
          /\{\{tool:([^}]+)\}\}/g,
          (_: string, slug: string) => {
            const tool = tools?.find((t) => t.slug === slug);
            return `<div style="border:1px solid #e5e5e5;padding:12px 16px;border-radius:8px;margin:8px 0;background:#fafafa;"><strong>⚙ ${tool?.name || slug}</strong> <span style="color:#999;">— embedded tool card</span></div>`;
          }
        );
      setPreviewHtml(marked.parse(processed) as string);
    });
  }, [showPreview, field.value, tools]);

  const insertAtCursor = useCallback(
    (textToInsert: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = field.value || "";
      const newValue =
        value.substring(0, start) + textToInsert + value.substring(end);

      field.onChange(newValue);

      // Restore cursor position
      requestAnimationFrame(() => {
        textarea.focus();
        const newPos = start + textToInsert.length;
        textarea.setSelectionRange(newPos, newPos);
      });
    },
    [field]
  );

  const handleToolbarAction = useCallback(
    (action: InsertAction) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = field.value || "";
      const selected = value.substring(start, end);

      if (action.action === "modal") {
        setModal(action.modalType || null);
        return;
      }

      let newValue: string;
      let cursorOffset: number;

      if (action.action === "wrap") {
        const before = action.before || "";
        const after = action.after || "";
        const wrapped = selected || "text";
        newValue =
          value.substring(0, start) +
          before +
          wrapped +
          after +
          value.substring(end);
        cursorOffset = start + before.length + wrapped.length;
      } else if (action.action === "prefix") {
        const prefix = action.before || "";
        // Find start of current line
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        newValue =
          value.substring(0, lineStart) +
          prefix +
          value.substring(lineStart);
        cursorOffset = start + prefix.length;
      } else {
        // insert
        const text = action.text || "";
        newValue =
          value.substring(0, start) + text + value.substring(end);
        cursorOffset = start + text.length;
      }

      field.onChange(newValue);

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorOffset, cursorOffset);
      });
    },
    [field]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium">{label}</label>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          {showPreview ? "← Editor" : "Preview →"}
        </button>
      </div>

      {/* Toolbar */}
      {!showPreview && (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border border-b-0 rounded-t-lg">
          {TOOLBAR_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => handleToolbarAction(action)}
              className="px-2 py-1 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
              title={action.label}
            >
              {action.icon}
            </button>
          ))}
        </div>
      )}

      {/* Editor / Preview */}
      {showPreview ? (
        <div
          className="prose max-w-none p-4 border rounded-lg bg-white min-h-[400px] text-sm"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={field.value || ""}
          onChange={(e) => field.onChange(e.target.value)}
          rows={20}
          className="w-full p-4 border rounded-b-lg font-mono text-sm resize-y min-h-[400px]"
          placeholder="Write your content in Markdown..."
        />
      )}

      {/* Modals */}
      {modal === "image" && (
        <ImageModal
          onInsert={insertAtCursor}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "link" && (
        <LinkModal
          posts={posts}
          onInsert={insertAtCursor}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "tool" && (
        <ToolModal
          tools={tools}
          onInsert={insertAtCursor}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
