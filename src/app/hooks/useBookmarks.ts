"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Bookmark } from "@/types/bookmark";

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

type UseBookmarksResult = {
  bookmarks: Bookmark[];
  loading: boolean;
  error: string | null;
  realtimeStatus: "enabled" | "disabled";

  // ✅ Step 2 additions
  isAdding: boolean;
  deletingIds: Set<string>;

  addBookmark: (payload: { title: string; url: string }) => Promise<void>;
  deleteBookmark: (bookmarkId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

type RealtimePayload = {
  eventType?: "INSERT" | "UPDATE" | "DELETE";
  new?: any;
  old?: any;
};

export function useBookmarks(userId: string | null | undefined): UseBookmarksResult {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<"enabled" | "disabled">("disabled");

  // ✅ Step 2 additions
  const [isAdding, setIsAdding] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const canQuery = useMemo(() => Boolean(userId), [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setBookmarks((data ?? []) as Bookmark[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!canQuery) {
      setBookmarks([]);
      setRealtimeStatus("disabled");
      return;
    }

    void refresh();

    // Prevent duplicate realtime subscriptions (hot reload etc.)
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel("bookmarks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookmarks" }, (p) => {
        const payload = p as RealtimePayload;

        const eventType = payload.eventType;
        const rowNew = payload.new ?? {};
        const rowOld = payload.old ?? {};

        // ✅ Do NOT change this logic — it’s what fixed delete realtime:
        // - INSERT/UPDATE: filter using new.user_id
        // - DELETE: use old.id (because old.user_id may not exist)
        if (eventType === "INSERT") {
          if (rowNew.user_id !== userId) return;

          setBookmarks((prev) => {
            if (prev.some((b) => b.id === rowNew.id)) return prev;
            return [rowNew as Bookmark, ...prev];
          });
          return;
        }

        if (eventType === "UPDATE") {
          if (rowNew.user_id !== userId) return;

          setBookmarks((prev) => prev.map((b) => (b.id === rowNew.id ? (rowNew as Bookmark) : b)));
          return;
        }

        if (eventType === "DELETE") {
          const deletedId = rowOld.id as string | undefined;
          if (!deletedId) {
            void refresh();
            return;
          }

          setBookmarks((prev) => prev.filter((b) => b.id !== deletedId));
          return;
        }

        void refresh();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeStatus("enabled");
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setRealtimeStatus("disabled");
    };
  }, [canQuery, refresh, userId]);

  const addBookmark = useCallback(
    async ({ title, url }: { title: string; url: string }) => {
      if (!userId) return;
      if (isAdding) return; // ✅ prevent double-click spam

      setError(null);
      setIsAdding(true);

      const cleanTitle = title.trim();
      const cleanUrl = normalizeUrl(url);

      if (!cleanTitle || !cleanUrl) {
        setError("Title and URL are required.");
        setIsAdding(false);
        return;
      }

      const { error: err } = await supabase.from("bookmarks").insert({
        user_id: userId,
        title: cleanTitle,
        url: cleanUrl,
      });

      if (err) setError(err.message);

      setIsAdding(false);
    },
    [userId, isAdding]
  );

  const deleteBookmark = useCallback(
    async (bookmarkId: string) => {
      if (!userId) return;

      // ✅ prevent double delete clicks
      if (deletingIds.has(bookmarkId)) return;

      setError(null);

      // ✅ Mark this row as "deleting"
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.add(bookmarkId);
        return next;
      });

      // ✅ Keep your optimistic local removal (current tab feels instant)
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));

      // ✅ Keep user_id guard
      const { error: err } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", bookmarkId)
        .eq("user_id", userId);

      if (err) {
        setError(err.message);
        // rollback safely
        void refresh();
      }

      // ✅ Clear deleting state
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(bookmarkId);
        return next;
      });
    },
    [refresh, userId, deletingIds]
  );

  return {
    bookmarks,
    loading,
    error,
    realtimeStatus,
    isAdding,
    deletingIds,
    addBookmark,
    deleteBookmark,
    refresh,
  };
}
