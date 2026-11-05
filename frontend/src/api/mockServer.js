/**
 * Fake backend that lives in localStorage so the whole app works today.
 * Every function mirrors one future REST endpoint. Delete this file (and set VITE_USE_MOCK=false)
 * once the real Node/Express + MongoDB backend is ready.
 */
import { STATUS, ROLES, TOKEN_KEY, PAGE_SIZE, START_YEAR } from '../utils/constants';
import { uid, similarity, normalize } from '../utils/helpers';
import { realtime, EV } from '../utils/realtime';

const KEY = 'cdm_db_v1';
export const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms));
const fail = (message, status = 400) => Object.assign(new Error(message), { status });

/* ---------------- seed data ---------------- */
const pic = (s) => `https://picsum.photos/seed/${s}/900/600`;
const PEOPLE = ['Aarav Sharma', 'Priya Nair', 'Rohan Das', 'Sneha Kulkarni', 'Imran Khan', 'Meera Joshi', 'Kabir Singh', 'Ananya Rao'];

const mk = (i, year, type, title, description, who, tags, related, likes) => ({
  id: `m_seed_${i}`,
  title, description, year, type,
  batch: `Batch ${year}`,
  eventDate: `${year}-${String((i % 9) + 1).padStart(2, '0')}-15`,
  tags, related,
  images: [pic(`campus${i}a`), pic(`campus${i}b`)],
  contributor: { id: `p_${who}`, name: PEOPLE[who] },
  status: STATUS.APPROVED,
  likes: Array.from({ length: likes }, (_, k) => `seed_${k}`),
  createdAt: new Date(Date.UTC(year, i % 9, 15)).toISOString(),
  duplicateOf: null, rejectReason: null,
});

const seed = () => ({
  users: [
    { id: 'u_admin', name: 'Campus Admin', email: 'admin@campus.com', password: 'admin123', role: ROLES.ADMIN, batch: 'Staff' },
    { id: 'u_demo', name: 'Demo Student', email: 'student@campus.com', password: 'student123', role: ROLES.STUDENT, batch: 'Batch 2024' },
  ],
  memories: [
    mk(1, 2018, 'event', 'Campus Journey Begins', 'The very first batch walked into half-painted classrooms, shared one projector and decided this place would be built by the people studying in it.', 0, ['first-batch', 'founding'], 'Orientation Week', 21),
    mk(2, 2019, 'event', 'First Hackathon in the Common Hall', 'Forty students, two extension boards and a night of cold pizza. Eight working prototypes by sunrise.', 1, ['hackathon', 'coding'], 'Hackathon 1.0', 17),
    mk(3, 2019, 'infrastructure', 'Library Corner Built by Students', 'Donated books, painted shelves and reading lamps made from scrap — the library corner opened with 300 books.', 2, ['library', 'volunteering'], 'Library Drive', 12),
    mk(4, 2020, 'learning', 'Learning Went Online', 'Classes moved to phones and shared hotspots. Peer-learning circles kept every batch moving forward.', 3, ['online', 'peer-learning'], 'Peer Circles', 9),
    mk(5, 2021, 'cultural', 'Cultural Night Under the Stars', 'Folk songs, stand-up, a dance-off and the first-ever campus band performing on the terrace.', 4, ['music', 'dance'], 'Annual Cultural Fest', 26),
    mk(6, 2022, 'event', 'Batch 2022 Joins — Campus Journey Started', 'A new batch, a fresh set of rules written by students themselves and the first campus welcome walk.', 5, ['welcome', 'new-batch'], 'Welcome Walk', 14),
    mk(7, 2022, 'infrastructure', 'Green Campus Drive: 500 Saplings', 'Every student planted and named a sapling. The mango corner is now the favourite lunch spot.', 6, ['green', 'sustainability'], 'Green Drive', 19),
    mk(8, 2023, 'project', 'First Student Tech Projects Showcase', 'Attendance app, a savings calculator and a campus map — the first demo day built entirely by students.', 7, ['projects', 'demo-day', 'web'], 'Demo Day 2023', 31),
    mk(9, 2023, 'achievement', 'Inter-Campus Football Cup Win', 'Down 0–2 at half time, level by the 70th minute, won on penalties. The cup lives in the common room.', 2, ['sports', 'football'], 'Inter-Campus Cup', 22),
    mk(10, 2024, 'learning', 'Community Teaching Weekends', 'Students taught basic computing in nearby schools every Saturday for a whole semester.', 1, ['community', 'teaching'], 'Teach Weekends', 15),
    mk(11, 2024, 'achievement', '24-Hour Hackathon, Run by Students', 'Students designed the problem statements, mentored teams and ran a 24-hour hackathon end to end.', 0, ['hackathon', 'leadership'], 'Hackathon 3.0', 28),
    mk(12, 2025, 'project', 'New Campus Initiatives Launch', 'Mentor circles, an alumni story wall and this very Digital Memory project kicked off together.', 3, ['initiatives', 'mentorship'], 'Initiatives 2025', 11),
  ],
});

/* ---------------- storage ---------------- */
const read = () => {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch { /* fall through */ }
  const d = seed();
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* ignore */ }
  return d;
};
const write = (db) => {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch { throw fail('Browser storage is full. Try fewer or smaller photos.'); }
};

const session = (db) => db.users.find((u) => u.id === localStorage.getItem(TOKEN_KEY)) || null;
const requireUser = (db) => session(db) || (() => { throw fail('Please log in first', 401); })();
const requireAdmin = (db) => {
  const u = requireUser(db);
  if (u.role !== ROLES.ADMIN) throw fail('Admins only', 403);
  return u;
};
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, batch: u.batch });
const toClient = (m, userId) => {
  const { likes, ...rest } = m;
  return { ...rest, likesCount: likes.length, liked: userId ? likes.includes(userId) : false };
};
const dateKey = (m) => m.eventDate || m.createdAt;

/* ---------------- auth ---------------- */
export async function login({ email, password }) {
  await delay();
  const u = read().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password);
  if (!u) throw fail('Wrong email or password', 401);
  return { token: u.id, user: publicUser(u) };
}

export async function register({ name, email, password, batch }) {
  await delay();
  const db = read();
  if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) throw fail('An account with this email already exists', 409);
  const u = { id: uid('u'), name: name.trim(), email: email.trim(), password, role: ROLES.STUDENT, batch };
  db.users.push(u);
  write(db);
  return { token: u.id, user: publicUser(u) };
}

export async function me() {
  await delay(80);
  const u = session(read());
  if (!u) throw fail('Session expired', 401);
  return { user: publicUser(u) };
}

/* ---------------- duplicates ---------------- */
export function findDuplicates(db, { title = '', description = '', year }, excludeId) {
  if (normalize(title).length < 4) return [];
  return db.memories
    .filter((m) => m.id !== excludeId && m.status !== STATUS.REJECTED && m.year === Number(year))
    .map((m) => {
      const same = normalize(m.title) === normalize(title);
      const score = same ? 1 : 0.7 * similarity(title, m.title) + 0.3 * similarity(description, m.description);
      return { id: m.id, title: m.title, year: m.year, status: m.status, score: +score.toFixed(2) };
    })
    .filter((x) => x.score >= 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export async function checkDuplicates(payload) {
  await delay(120);
  return findDuplicates(read(), payload);
}

/* ---------------- memories ---------------- */
export async function listMemories({ q, year, batch, type, sort = 'desc', page = 1, limit = PAGE_SIZE } = {}) {
  await delay(180);
  const db = read();
  const u = session(db);
  const words = q ? normalize(q).split(' ') : [];
  let rows = db.memories.filter((m) =>
    m.status === STATUS.APPROVED && (!year || m.year === Number(year)) && (!batch || m.batch === batch) && (!type || m.type === type));
  if (words.length) {
    rows = rows.filter((m) => {
      const hay = normalize([m.title, m.description, m.contributor.name, m.related, m.batch, m.year, m.tags.join(' ')].join(' '));
      return words.every((w) => hay.includes(w));
    });
  }
  const dir = sort === 'asc' ? 1 : -1;
  rows.sort((a, b) => dir * (a.year - b.year || dateKey(a).localeCompare(dateKey(b))));
  return {
    items: rows.slice((page - 1) * limit, page * limit).map((m) => toClient(m, u?.id)),
    total: rows.length, page, hasMore: page * limit < rows.length,
  };
}

export async function getStats() {
  await delay(100);
  const db = read();
  const ok = db.memories.filter((m) => m.status === STATUS.APPROVED);
  const years = {};
  ok.forEach((m) => { years[m.year] = (years[m.year] || 0) + 1; });
  return {
    total: ok.length,
    contributors: new Set(ok.map((m) => m.contributor.id)).size,
    years,
    firstYear: START_YEAR,
  };
}

export async function getMemory(id) {
  await delay(100);
  const db = read();
  const u = session(db);
  const m = db.memories.find((x) => x.id === id);
  if (!m || (m.status !== STATUS.APPROVED && m.contributor.id !== u?.id && u?.role !== ROLES.ADMIN)) throw fail('Memory not found', 404);
  return toClient(m, u?.id);
}

export async function createMemory(p) {
  await delay(450);
  const db = read();
  const u = requireUser(db);
  const dups = findDuplicates(db, p);
  const m = {
    id: uid('m'), title: p.title.trim(), description: p.description.trim(), year: Number(p.year),
    type: p.type, batch: p.batch, eventDate: p.eventDate || null, tags: p.tags || [], related: p.related || '',
    images: (p.images || []).slice(0, 4), contributor: { id: u.id, name: u.name }, status: STATUS.PENDING,
    likes: [], createdAt: new Date().toISOString(), duplicateOf: dups[0]?.id || null, duplicateScore: dups[0]?.score || null, rejectReason: null,
  };
  db.memories.unshift(m);
  write(db);
  realtime.emit(EV.NEW, { id: m.id, title: m.title, by: u.name });
  if (dups.length) realtime.emit(EV.DUPLICATE, { id: m.id, title: m.title, of: dups[0] });
  return { memory: toClient(m, u.id), duplicates: dups };
}

export async function myMemories() {
  await delay(200);
  const db = read();
  const u = requireUser(db);
  return db.memories.filter((m) => m.contributor.id === u.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((m) => toClient(m, u.id));
}

export async function toggleLike(id) {
  await delay(80);
  const db = read();
  const u = requireUser(db);
  const m = db.memories.find((x) => x.id === id);
  if (!m) throw fail('Memory not found', 404);
  m.likes = m.likes.includes(u.id) ? m.likes.filter((x) => x !== u.id) : [...m.likes, u.id];
  write(db);
  return { liked: m.likes.includes(u.id), likesCount: m.likes.length };
}

/* ---------------- admin ---------------- */
export async function adminList({ status = STATUS.PENDING, page = 1, limit = 20 } = {}) {
  await delay(200);
  const db = read();
  requireAdmin(db);
  const counts = { pending: 0, approved: 0, rejected: 0 };
  db.memories.forEach((m) => { counts[m.status]++; });
  const rows = db.memories.filter((m) => m.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const items = rows.slice((page - 1) * limit, page * limit).map((m) => ({
    ...toClient(m),
    duplicateTitle: m.duplicateOf ? db.memories.find((x) => x.id === m.duplicateOf)?.title : null,
  }));
  return { items, total: rows.length, hasMore: page * limit < rows.length, counts };
}

export async function reviewMemory(id, { status, reason }) {
  await delay(250);
  const db = read();
  requireAdmin(db);
  const m = db.memories.find((x) => x.id === id);
  if (!m) throw fail('Memory not found', 404);
  m.status = status;
  m.rejectReason = status === STATUS.REJECTED ? reason || 'Not suitable for the timeline' : null;
  write(db);
  if (status === STATUS.APPROVED) realtime.emit(EV.PUBLISHED, toClient(m));
  realtime.emit(EV.REVIEWED, { id: m.id, title: m.title, status, reason: m.rejectReason, userId: m.contributor.id });
  return toClient(m);
}

export async function updateMemory(id, changes) {
  await delay(250);
  const db = read();
  requireAdmin(db);
  const m = db.memories.find((x) => x.id === id);
  if (!m) throw fail('Memory not found', 404);
  const changed = [];
  ['year', 'eventDate', 'title', 'description'].forEach((k) => {
    if (changes[k] !== undefined && changes[k] !== m[k]) { m[k] = k === 'year' ? Number(changes[k]) : changes[k]; changed.push(k === 'eventDate' ? 'date' : k); }
  });
  if (changed.includes('year')) m.batch = `Batch ${m.year}`;
  write(db);
  if (m.status === STATUS.APPROVED && changed.length) realtime.emit(EV.UPDATED, { memory: toClient(m), changed });
  return toClient(m);
}
