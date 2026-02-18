# Smart Bookmark App

A production-ready bookmark manager built with Next.js, Supabase, and Tailwind CSS.

This application demonstrates secure authentication, row-level security (RLS),
real-time synchronization across browser tabs, and production-minded UX patterns.

---

## ✨ Features

- 🔐 Google OAuth authentication (Supabase Auth)
- 🛡️ Row-Level Security (RLS) enforced at the database layer
- ⚡ Real-time sync across multiple tabs using Supabase Realtime
- 🧠 Optimistic UI updates for smoother user experience
- 🚫 Duplicate action protection (no double add/delete)
- 📋 Copy-to-clipboard functionality with fallback support
- 🔗 Explicit open bookmark action
- 🎯 Clean component and hook separation
- 🎨 Modern UI with Tailwind CSS

---

## 🏗️ Architecture Overview

This project follows a clean separation of concerns:

app/
page.tsx

components/
BookmarkForm.tsx
BookmarkList.tsx
BookmarkScreen.tsx
SignInCard.tsx

hooks/
useBookmarks.ts

lib/
supabase.ts

types/
bookmark.ts


### Key Design Decisions

- Business logic isolated inside `useBookmarks` hook
- UI components remain presentational
- Database filtering enforced via RLS (not frontend checks)
- Realtime handled via `postgres_changes` subscription
- DELETE events handled using primary key (`old.id`) to ensure reliable cross-tab sync

---

## 🔐 Authentication

- Supabase Auth with Google OAuth
- Session handled client-side
- Protected bookmarks via RLS policy:

user_id = auth.uid()


Only authenticated users can view and modify their own bookmarks.

---

## ⚡ Real-Time Synchronization

- Uses Supabase `postgres_changes`
- Subscribes to INSERT, UPDATE, DELETE events
- Cross-tab consistency maintained without manual refresh
- DELETE handled via primary key to avoid missing payload fields

Optional (recommended DB configuration):

ALTER TABLE public.bookmarks REPLICA IDENTITY FULL;


---

## 🚀 Getting Started

### 1. Clone the Repository

git clone <your-repo-url>
cd smart-bookmark-app


### 2. Install Dependencies

npm install


### 3. Configure Environment Variables

Create a `.env.local` file:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key


### 4. Run Development Server

npm run dev


Open:

http://localhost:3000


---

## 🗄️ Database Schema

### Table: bookmarks

id uuid (primary key)
user_id uuid (references auth.users)
title text
url text
created_at timestamp


---

## 🛡️ Row-Level Security Policy

CREATE POLICY "Users can access their own bookmarks"
ON bookmarks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


RLS ensures data isolation at the database layer.

---

## 🧠 UX Enhancements Implemented

- Optimistic delete behavior
- Add button loading state
- Per-item delete protection
- Clipboard success feedback
- Disabled states during mutations
- Clear empty-state messaging

---

## 📦 Production Considerations

- No duplicate realtime channels
- Cleanup on unmount
- Guard against double submissions
- Error banner handling
- Clean commit history with scoped messages

---

## 🧪 How to Test Realtime

1. Open the app in two browser tabs.
2. Add or delete bookmarks in one tab.
3. Observe the second tab updating instantly without refresh.

---

## 🛠 Tech Stack

- Next.js (App Router)
- TypeScript
- Supabase (Auth + Database + Realtime)
- Tailwind CSS
- Postgres (RLS enabled)

---

## 📌 Tradeoffs

- Client-side data fetching (no SSR required for this scope)
- Minimal dependency footprint
- Focused on correctness and realtime reliability over feature bloat

---

## 🚀 Deployment

LIVE Link : https://smart-bookmark-6n6nk5oqg-musclesgloves-projects.vercel.app/

Build for production:

- npm run build
- npm start


---

## 👨‍💻 Author

Built as part of a technical assessment demonstrating:

- Secure full-stack implementation
- Real-time distributed state handling
- Production-minded UX and architecture decisions