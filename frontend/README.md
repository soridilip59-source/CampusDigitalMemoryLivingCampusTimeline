# Campus Digital Memory — Frontend

React + Vite + Tailwind CSS. Works fully **without a backend** (built-in mock server in `localStorage`), so you can demo it today and plug in the real API later.

## Run
```bash
npm install
npm run dev        # http://localhost:5173
```
Demo logins: `student@campus.com / student123` and `admin@campus.com / admin123`.
Tip: open two tabs (student + admin) to see real-time updates, duplicate alerts and live date changes.

## Features
- Year-wise timeline with sticky giant year headers, alternating cards, photo galleries
- Search (title, person, event, project, year, tags), year / batch / type filters, sort order
- Memory submission with live preview, photo upload (compressed in the browser), tags, related event/project
- Live duplicate detection while typing + flagged for admins on submit
- Admin review queue: approve / reject with reason / edit date or year (published changes reach all users instantly)
- My Submissions with pending / approved / rejected tabs and admin notes
- Likes, shareable links (`/?m=<id>`), dark mode, toasts, 404 page, error boundary
- Fully responsive (mobile, tablet, desktop)

## Built for many users
- Server-side pagination + infinite scroll (never loads the whole archive)
- Debounced search, stale-response cancellation, debounced live refresh (one request, not one per event)
- Route-level code splitting, lazy images, `React.memo` cards
- Client-side image compression, axios retry with backoff on 429/503

## Connecting the real backend
1. `.env` → `VITE_USE_MOCK=false`, set `VITE_API_URL` (and `VITE_SOCKET_URL`)
2. Backend routes expected by `src/api/`:

| Method | Route | Notes |
|---|---|---|
| POST | `/auth/login`, `/auth/register` | returns `{ token, user }` |
| GET | `/auth/me` | `{ user }` |
| GET | `/memories` | query: `q, year, batch, type, sort, page, limit` → `{ items, total, hasMore }` |
| GET | `/memories/stats` | `{ total, contributors, years: { 2023: 4 } }` |
| GET | `/memories/:id` | |
| POST | `/memories` | multipart: fields + `images[]` → `{ memory, duplicates }` |
| POST | `/memories/check-duplicates` | `{ title, description, year }` → array |
| GET | `/memories/mine` | |
| POST | `/memories/:id/like` | `{ liked, likesCount }` |
| GET | `/admin/memories?status=&page=` | `{ items, total, hasMore, counts }` |
| PATCH | `/admin/memories/:id/review` | `{ status, reason }` |
| PATCH | `/admin/memories/:id` | `{ year, eventDate }` |

3. Real-time: edit only `src/utils/realtime.js` to use `socket.io-client`. Events: `memory:new`, `memory:duplicate`, `memory:published`, `memory:updated`, `memory:reviewed`.
4. Delete `src/api/mockServer.js`.
