"use client";

import { useRef, useState } from "react";
import type { Bookmark } from "@/types/bookmark";

type Props = {
  items: Bookmark[];
  onDelete: (id: string) => Promise<void>;
  busy?: boolean;
};

async function copyToClipboard(text: string) {
  // Prefer modern Clipboard API
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback for older/blocked contexts
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function BookmarkList({ items, onDelete, busy }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleCopy = async (b: Bookmark) => {
    try {
      await copyToClipboard(b.url);
      setCopiedId(b.id);

      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopiedId(null), 1200);
    } catch {
      // If clipboard fails, we keep UX silent (no ugly alert in a take-home).
      // If you want, you can surface this through your global error banner later.
      setCopiedId(null);
    }
  };

  if (items.length === 0) {
    return <p className="mt-5 text-sm text-white/55">No bookmarks yet. Add your first one above.</p>;
  }

  return (
    <ul className="mt-5 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      {items.map((b) => {
        const isCopied = copiedId === b.id;

        return (
          <li
            key={b.id}
            className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{b.title}</p>

              <a
                href={b.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block cursor-pointer truncate text-xs text-blue-300 hover:text-blue-200"
                title={b.url}
              >
                {b.url}
              </a>
            </div>

            <div className="flex flex-wrap gap-2 md:flex-nowrap md:justify-end">
              {/* Open button (explicit action, feels premium) */}
              <a
                href={b.url}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/10"
                title="Open bookmark"
              >
                Open
              </a>

              {/* Copy link */}
              <button
                type="button"
                onClick={() => handleCopy(b)}
                disabled={busy}
                className="cursor-pointer rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                title="Copy link"
              >
                {isCopied ? "Copied!" : "Copy"}
              </button>

              {/* Delete */}
              <button
                onClick={() => onDelete(b.id)}
                disabled={busy}
                className="cursor-pointer rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                title="Delete bookmark"
              >
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
