# Campus Digital Memory · Living Campus Timeline

A React 18 + Vite + Tailwind frontend and Express + MongoDB backend for collecting and exploring campus memories. The frontend includes an IndexedDB mock mode for local demos; configure the environment files to use the real API, Google login, Cloudinary uploads, and Socket.IO updates.

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
cd backend
copy .env.example .env
npm install
npm run dev
```

In another terminal:

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Fill in MongoDB, JWT, and Cloudinary values in `backend/.env`. Add the same Google OAuth Web client ID to `GOOGLE_CLIENT_ID` in the backend env and `VITE_GOOGLE_CLIENT_ID` in the frontend env; authorize `http://localhost:5173` in Google Cloud Console. Set `VITE_USE_MOCK=true` for the seeded demo mode. Build the frontend with `npm run build` and run the mock API syntax check with `npm run check`.

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
backend/        Express API, MongoDB models, Google authentication, and Socket.IO
```
