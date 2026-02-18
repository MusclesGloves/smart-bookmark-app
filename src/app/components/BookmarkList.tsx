"use client";

import type { Bookmark } from "@/types/bookmark";

type Props = {
  items: Bookmark[];
  onDelete: (id: string) => Promise<void>;
  busy?: boolean;
};

export function BookmarkList({ items, onDelete, busy }: Props) {
  if (items.length === 0) {
    return <p className="mt-5 text-sm text-white/55">No bookmarks yet. Add your first one above.</p>;
  }

  return (
    <ul className="mt-5 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      {items.map((b) => (
        <li
          key={b.id}
          className="flex flex-col gap-2 px-5 py-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{b.title}</p>
            <a
              href={b.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block truncate text-xs text-blue-300 hover:text-blue-200"
              title={b.url}
            >
              {b.url}
            </a>
          </div>

          <button
            onClick={() => onDelete(b.id)}
            disabled={busy}
            className="cursor-pointer self-start rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60 md:self-auto"
            title="Delete bookmark"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
