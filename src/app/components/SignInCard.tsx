"use client";

type Props = {
  onSignIn: () => void;
  disabled?: boolean;
};

export function SignInCard({ onSignIn, disabled }: Props) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
      <h1 className="text-2xl font-semibold">Smart Bookmark App</h1>
      <p className="mt-2 text-sm text-white/70">
        Sign in with Google to add private bookmarks that sync in real time.
      </p>

      <button
        onClick={onSignIn}
        disabled={disabled}
        className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Sign in with Google
      </button>

      <p className="mt-3 text-xs text-white/50">No email/password — OAuth only.</p>
    </div>
  );
}
