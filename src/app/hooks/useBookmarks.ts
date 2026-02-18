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

        // ✅ Key idea:
        // - INSERT/UPDATE: we can filter using new.user_id
        // - DELETE: old.user_id is often NOT present unless REPLICA IDENTITY FULL,
        //          so we use old.id (primary key) instead.

        if (eventType === "INSERT") {
          if (rowNew.user_id !== userId) return;

          setBookmarks((prev) => {
            // avoid duplicates if you also refresh somewhere
            if (prev.some((b) => b.id === rowNew.id)) return prev;
            return [rowNew as Bookmark, ...prev];
          });
          return;
        }

        if (eventType === "UPDATE") {
          // if it’s not ours, ignore
          if (rowNew.user_id !== userId) return;

          setBookmarks((prev) => prev.map((b) => (b.id === rowNew.id ? (rowNew as Bookmark) : b)));
          return;
        }

        if (eventType === "DELETE") {
          const deletedId = rowOld.id as string | undefined;
          if (!deletedId) {
            // super rare fallback
            void refresh();
            return;
          }

          // Remove locally (this makes the other tab update instantly)
          setBookmarks((prev) => prev.filter((b) => b.id !== deletedId));
          return;
        }

        // Fallback safety
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
      setError(null);

      const cleanTitle = title.trim();
      const cleanUrl = normalizeUrl(url);

      if (!cleanTitle || !cleanUrl) {
        setError("Title and URL are required.");
        return;
      }

      // Optional optimistic UI (current tab only)
      // You can skip this since INSERT realtime will come back quickly.

      const { error: err } = await supabase.from("bookmarks").insert({
        user_id: userId,
        title: cleanTitle,
        url: cleanUrl,
      });

      if (err) setError(err.message);
    },
    [userId]
  );

  const deleteBookmark = useCallback(
    async (bookmarkId: string) => {
      if (!userId) return;

      setError(null);

      // ✅ Optimistic UI: current tab updates instantly
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));

      // Add user_id guard (prevents accidental deletes across users even if RLS changes)
      const { error: err } = await supabase.from("bookmarks").delete().eq("id", bookmarkId).eq("user_id", userId);

      if (err) {
        setError(err.message);
        // rollback by refetching
        void refresh();
      }
    },
    [refresh, userId]
  );

  return { bookmarks, loading, error, realtimeStatus, addBookmark, deleteBookmark, refresh };
}
