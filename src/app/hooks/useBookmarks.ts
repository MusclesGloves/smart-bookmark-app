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
      .channel(`bookmarks:user:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void refresh();
        }
      )
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

      const { error: err } = await supabase.from("bookmarks").insert({
        user_id: userId,
        title: cleanTitle,
        url: cleanUrl,
      });

      if (err) setError(err.message);
    },
    [userId]
  );

  const deleteBookmark = useCallback(async (bookmarkId: string) => {
    setError(null);
    const { error: err } = await supabase.from("bookmarks").delete().eq("id", bookmarkId);
    if (err) setError(err.message);
  }, []);

  return { bookmarks, loading, error, realtimeStatus, addBookmark, deleteBookmark, refresh };
}
