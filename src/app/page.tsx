"use client";

import { AppShell } from "./components/AppShell";
import { BookmarksScreen } from "./components/BookmarkScreen";
import { SignInCard } from "./components/SignInCard";
import { useSession } from "./hooks/useSession";

export default function Page() {
  const { session, loading, signInWithGoogle, signOut } = useSession();

  const userId = session?.user?.id;
  const email = session?.user?.email;

  return (
    <AppShell>
      {loading ? (
        <p className="text-sm text-white/60">Loading…</p>
      ) : userId ? (
        <BookmarksScreen userId={userId} email={email} onSignOut={signOut} />
      ) : (
        <SignInCard onSignIn={signInWithGoogle} />
      )}
    </AppShell>
  );
}
