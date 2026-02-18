"use client";

import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10">
        {children}
      </div>
    </main>
  );
}
