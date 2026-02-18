"use client";

import { useMemo, useState } from "react";

type Props = {
  onAdd: (payload: { title: string; url: string }) => Promise<void>;
  onRefresh: () => Promise<void>;
  busy?: boolean;
};

export function BookmarkForm({ onAdd, onRefresh, busy }: Props) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const canSubmit = useMemo(() => title.trim().length > 0 && url.trim().length > 0, [title, url]);

  async function handleSubmit() {
    if (!canSubmit || busy) return;
    await onAdd({ title, url });
    setTitle("");
    setUrl("");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs text-white/60">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Supabase Docs"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none ring-0 focus:border-white/25"
          />
        </div>
        <div>
          <label className="text-xs text-white/60">URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g. supabase.com/docs"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none ring-0 focus:border-white/25"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || busy}
          className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add Bookmark
        </button>

        <button
          onClick={onRefresh}
          disabled={busy}
          className="cursor-pointer rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
