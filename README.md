# Campus Digital Memory · Living Campus Timeline

A React 18 + Vite + Tailwind frontend for collecting and exploring campus memories. The frontend uses a mock API backed by IndexedDB; the mock is initialized from seed data and migrates the previous `cdm_db_v1` localStorage database on first use. Saved-memory IDs, theme settings, and the selected accent remain in localStorage.

## Features

- Campus timeline with search, year/type filters, likes, comments, reactions, saved memories, and notifications.
- Weekly trending memories, “On this day”, surprise selection, and an admin-curated featured carousel.
- Admin review, contributor-owned edits/deletes, memory reports, and curated collections.
- Contributor profiles with memory, like, and badge summaries.
- Three-step memory submission, live duplicate detection, photo resizing, drag-and-drop, and draft recovery.
- Copy-link and WhatsApp sharing, keyboard-accessible photo lightbox, dark mode, accent palettes, and mobile tabs.
- Keyboard quick search: `Ctrl+K` / `Cmd+K`.

## Routes

| Route | Page |
| --- | --- |
| `/` | Campus timeline and discovery sections |
| `/submit` | Protected three-step submission form |
| `/my-submissions` | Protected contribution management |
| `/saved` | Protected saved memories |
| `/admin` | Admin review and reported memories |
| `/collections` | Collection index and admin management |
| `/collections/:id` | Collection contents |
| `/u/:id` | Contributor profile |
| `/login`, `/register` | Authentication |

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Build with `npm run build`; run the mock API syntax check with `npm run check`. Demo accounts are `student@campus.com` / `student123` and `admin@campus.com` / `admin123`.

## Folder structure

```text
frontend/src/
  api/          IndexedDB mock server, transaction queue, API wrappers
  components/   common, layout, memory, and route components
  context/      authentication and toast state
  hooks/        auth, memory, theme, realtime, and utility hooks
  pages/        timeline, submission, admin, saved, collections, profiles
  routes/       application routes
  styles/       global styles, responsive rules, and design tokens
  utils/        constants, date formatting, image compression, saved IDs, realtime
backend/        existing scaffold; not used by the frontend demo
```
