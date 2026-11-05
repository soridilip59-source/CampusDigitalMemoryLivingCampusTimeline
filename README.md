# Campus Digital Memory · Living Campus Timeline

A responsive React 18 archive for campus stories, events, projects, and photographs. The frontend uses a localStorage mock backend by default, with BroadcastChannel events to keep open tabs in sync. No backend is required for the demo.

## Features

- Browse and filter the campus timeline, with calendar, grid, trending, featured, and “On this day” views.
- Submit memories for review with photo previews, client-side image resizing, drafts, and duplicate hints.
- Like, react, comment, save, share, and report memories; receive in-app notifications.
- Admin review queue, featured memories, reports, collections, and contributor profiles.
- Dark mode, accent color control, keyboard search (`Ctrl+K` / `Cmd+K`), and mobile navigation.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Create a production build with `npm run build` from `frontend`. Mock mode is enabled unless `VITE_USE_MOCK=false` is set. The mock database is stored in browser localStorage under `cdm_db_v1`; clear that key to reset demo data.

## Demo logins

- Student: `student@campus.com` / `student123`
- Admin: `admin@campus.com` / `admin123`

## Folder structure

```text
frontend/
  src/
    api/          API wrappers and localStorage mock server
    components/   common, layout, memory, and route components
    context/      authentication and toast providers
    hooks/        auth, theme, memory, realtime, and utility hooks
    pages/        timeline, submit, admin, profile, saved, and notifications
    routes/       application routes
    styles/       global styles and design tokens
    utils/        constants, formatting, image compression, realtime, saved items
backend/          existing Node/Express API scaffold
```

The backend directory is an existing scaffold. This implementation leaves the mock server in place and requires no new server to run the frontend.
