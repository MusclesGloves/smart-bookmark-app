"use client";

import { useMemo } from "react";
import { BookmarkForm } from "../components/BookmarkForm";
import { BookmarkList } from "../components/BookmarkList";
import { useBookmarks } from "../hooks/useBookmarks";

type Props = {
  userId: string;
  email?: string | null;
  onSignOut: () => void;
};

export function BookmarksScreen({ userId, email, onSignOut }: Props) {
  const {
    bookmarks,
    loading,
    error,
    realtimeStatus,
    isAdding,
    deletingIds,
    addBookmark,
    deleteBookmark,
    refresh,
  } = useBookmarks(userId);

  const realtimeLabel = useMemo(() => {
    return realtimeStatus === "enabled" ? "Realtime enabled (try 2 tabs)" : "Realtime connecting…";
  }, [realtimeStatus]);

  const isDeletingAny = deletingIds.size > 0;

  return (
    <div className="w-full max-w-3xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">My Bookmarks</h1>
          <p className="mt-1 text-sm text-white/60">Signed in as {email ?? "(unknown)"}</p>
        </div>

        <button
          onClick={onSignOut}
          className="cursor-pointer self-start rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Sign out
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-white/70">Private bookmarks only — enforced by Supabase RLS.</p>
          <p className="text-xs text-white/50">{realtimeLabel}</p>
        </div>
      </div>

      <div className="mt-4">
        {/* ✅ busy now includes add + delete to avoid spamming actions */}
        <BookmarkForm onAdd={addBookmark} onRefresh={refresh} busy={loading || isAdding || isDeletingAny} />

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {/* ✅ Better status text */}
        {loading ? <p className="mt-4 text-sm text-white/55">Loading bookmarks…</p> : null}
        {isAdding ? <p className="mt-2 text-sm text-white/55">Adding bookmark…</p> : null}
        {isDeletingAny ? <p className="mt-2 text-sm text-white/55">Deleting…</p> : null}

        {/* ✅ keep same API; disable delete while deleting to avoid duplicate clicks */}
        <BookmarkList items={bookmarks} onDelete={deleteBookmark} busy={loading || isDeletingAny} />
      </div>

      <p className="mt-6 text-xs text-white/45">
        Tip: open this app in two tabs. Add/delete bookmarks in one tab and watch the other update.
      </p>
    </div>
  );
}
