/**
 * Fake backend that lives in localStorage so the whole app works today.
 * Every function mirrors one future REST endpoint. Delete this file (and set VITE_USE_MOCK=false)
 * once the real Node/Express + MongoDB backend is ready.
 */
import { STATUS, ROLES, TOKEN_KEY, PAGE_SIZE, START_YEAR } from '../utils/constants';
import { uid, similarity, normalize } from '../utils/helpers';
import { realtime, EV } from '../utils/realtime';
import { getDb, tx } from './idb';

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
  likeEvents: [], comments: [], reactions: { '❤️': [], '😂': [], '😢': [], '🔥': [] }, featured: false,
  createdAt: new Date(Date.UTC(year, i % 9, 15)).toISOString(),
  duplicateOf: null, rejectReason: null,
});

const seed = () => ({
  notifications: [],
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
const read = () => getDb(seed, KEY);
const write = (db) => tx(() => db);

const session = (db) => db.users.find((u) => u.id === localStorage.getItem(TOKEN_KEY)) || null;
const requireUser = (db) => session(db) || (() => { throw fail('Please log in first', 401); })();
const requireAdmin = (db) => {
  const u = requireUser(db);
  if (u.role !== ROLES.ADMIN) throw fail('Admins only', 403);
  return u;
};
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, batch: u.batch });
const toClient = (m, userId) => {
  const { likes = [], reactions = { '❤️': [], '😂': [], '😢': [], '🔥': [] }, ...rest } = m;
  const reactionCounts = Object.fromEntries(Object.entries(reactions).map(([emoji, users]) => [emoji, users.length]));
  return { ...rest, reactions, reactionCounts, myReaction: userId ? Object.keys(reactions).find((emoji) => reactions[emoji].includes(userId)) || null : null, comments: rest.comments || [], likesCount: likes.length, liked: userId ? likes.includes(userId) : false };
};
const notify = (db, recipientId, payload) => {
  if (!recipientId || recipientId === payload.actorId) return;
  const item = { id: uid('n'), userId: recipientId, read: false, createdAt: new Date().toISOString(), ...payload };
  (db.notifications ||= []).unshift(item);
  realtime.emit(EV.NOTIFY, item);
};
const dateKey = (m) => m.eventDate || m.createdAt;

/* ---------------- auth ---------------- */
export async function login({ email, password }) {
  await delay();
  const db = await read();
  const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password);
  if (!u) throw fail('Wrong email or password', 401);
  return { token: u.id, user: publicUser(u) };
}

export async function register({ name, email, password, batch }) {
  await delay();
  const db = await read();
  if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) throw fail('An account with this email already exists', 409);
  const u = { id: uid('u'), name: name.trim(), email: email.trim(), password, role: ROLES.STUDENT, batch };
  db.users.push(u);
  await write(db);
  return { token: u.id, user: publicUser(u) };
}

export async function me() {
  await delay(80);
  const u = session(await read());
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
  return findDuplicates(await read(), payload);
}

/* ---------------- memories ---------------- */
export async function listMemories({ q, year, batch, type, sort = 'desc', page = 1, limit = PAGE_SIZE } = {}) {
  await delay(180);
  const db = await read();
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
  const db = await read();
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

export async function getHomeExtras() {
  const db = await read(); const userId = session(db)?.id; const now = new Date(); const cutoff = Date.now() - 7 * 86400000;
  const approved = db.memories.filter((m) => m.status === STATUS.APPROVED);
  const trending = approved.map((m) => ({ ...toClient(m, userId), weekScore: (m.likeEvents || []).filter((e) => Date.parse(e.at) >= cutoff).length + (m.comments || []).filter((c) => Date.parse(c.createdAt) >= cutoff).length })).filter((m) => m.weekScore > 0).sort((a, b) => b.weekScore - a.weekScore).slice(0, 5);
  const onThisDay = approved.filter((m) => m.eventDate && Number(m.year) < now.getFullYear() && m.eventDate.slice(5, 10) === `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`).map((m) => toClient(m, userId));
  const featured = approved.filter((m) => m.featured).map((m) => toClient(m, userId));
  return { trending, onThisDay, featured };
}

export async function getMemory(id) {
  await delay(100);
  const db = await read();
  const u = session(db);
  const m = db.memories.find((x) => x.id === id);
  if (!m || (m.status !== STATUS.APPROVED && m.contributor.id !== u?.id && u?.role !== ROLES.ADMIN)) throw fail('Memory not found', 404);
  return toClient(m, u?.id);
}

export async function createMemory(p) {
  await delay(450);
  const db = await read();
  const u = requireUser(db);
  const dups = findDuplicates(db, p);
  const m = {
    id: uid('m'), title: p.title.trim(), description: p.description.trim(), year: Number(p.year),
    type: p.type, batch: p.batch, eventDate: p.eventDate || null, tags: p.tags || [], related: p.related || '',
    images: (p.images || []).slice(0, 4), contributor: { id: u.id, name: u.name }, status: STATUS.PENDING,
    likes: [], comments: [], reactions: { '❤️': [], '😂': [], '😢': [], '🔥': [] }, createdAt: new Date().toISOString(), duplicateOf: dups[0]?.id || null, duplicateScore: dups[0]?.score || null, rejectReason: null,
  };
  db.memories.unshift(m);
  await write(db);
  realtime.emit(EV.NEW, { id: m.id, title: m.title, by: u.name });
  if (dups.length) realtime.emit(EV.DUPLICATE, { id: m.id, title: m.title, of: dups[0] });
  return { memory: toClient(m, u.id), duplicates: dups };
}

export async function myMemories() {
  await delay(200);
  const db = await read();
  const u = requireUser(db);
  return db.memories.filter((m) => m.contributor.id === u.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((m) => toClient(m, u.id));
}

export async function editOwnMemory(id, changes) {
  const db = await read(); const u = requireUser(db); const m = db.memories.find((x) => x.id === id && x.contributor.id === u.id);
  if (!m || ![STATUS.PENDING, STATUS.REJECTED].includes(m.status)) throw fail('Only your pending or rejected memories can be edited', 403);
  ['title', 'description', 'eventDate', 'type', 'batch', 'tags', 'related', 'images'].forEach((key) => { if (changes[key] !== undefined) m[key] = changes[key]; });
  if (changes.year !== undefined) { m.year = Number(changes.year); m.batch = changes.batch || `Batch ${m.year}`; }
  if (m.status === STATUS.REJECTED) { m.status = STATUS.PENDING; m.rejectReason = null; db.users.filter((x) => x.role === ROLES.ADMIN).forEach((admin) => notify(db, admin.id, { type: 'new_pending', memoryId: m.id, memoryTitle: m.title, actorId: u.id, actorName: u.name, text: `${u.name} revised a rejected memory for review` })); realtime.emit(EV.NEW, { id: m.id, title: m.title, by: u.name }); }
  await write(db); return toClient(m, u.id);
}

export async function deleteOwnMemory(id) {
  const db = await read(); const u = requireUser(db); const m = db.memories.find((x) => x.id === id && x.contributor.id === u.id);
  if (!m || m.status !== STATUS.PENDING) throw fail('Only your pending memories can be deleted', 403);
  db.memories = db.memories.filter((x) => x.id !== id); await write(db); return true;
}

const REPORT_REASONS = ['wrong info', 'duplicate', 'inappropriate'];
export async function reportMemory(id, reason) {
  const db = await read(); const u = requireUser(db); const m = db.memories.find((x) => x.id === id);
  if (!m || m.status !== STATUS.APPROVED) throw fail('Memory not found', 404);
  if (!REPORT_REASONS.includes(reason)) throw fail('Choose a valid report reason');
  m.reports ||= []; if (!m.reports.some((r) => r.userId === u.id)) m.reports.push({ id: uid('r'), userId: u.id, userName: u.name, reason, createdAt: new Date().toISOString() });
  m.reported = true;
  db.users.filter((x) => x.role === ROLES.ADMIN).forEach((admin) => notify(db, admin.id, { type: 'report', memoryId: m.id, memoryTitle: m.title, actorId: u.id, actorName: u.name, text: `${u.name} reported “${m.title}”: ${reason}` }));
  await write(db); return true;
}

export async function listReported() { const db = await read(); requireAdmin(db); return db.memories.filter((m) => m.reported).map((m) => toClient(m)); }
export async function dismissReport(id) { const db = await read(); requireAdmin(db); const m = db.memories.find((x) => x.id === id); if (!m) throw fail('Memory not found', 404); m.reported = false; m.reports = []; await write(db); return true; }
export async function deleteReported(id) { const db = await read(); requireAdmin(db); const m = db.memories.find((x) => x.id === id && x.reported); if (!m) throw fail('Reported memory not found', 404); db.memories = db.memories.filter((x) => x.id !== id); await write(db); return true; }

export async function listCollections() { const db = await read(); return (db.collections || []).map((c) => ({ ...c, count: c.memoryIds?.length || 0 })); }
export async function createCollection(payload) { const db = await read(); requireAdmin(db); const name = String(payload.name || '').trim(); if (!name) throw fail('Collection name is required'); const c = { id: uid('col'), name, description: String(payload.description || '').trim(), memoryIds: [], createdAt: new Date().toISOString() }; (db.collections ||= []).push(c); await write(db); return c; }
export async function updateCollection(id, payload) { const db = await read(); requireAdmin(db); const c = (db.collections || []).find((x) => x.id === id); if (!c) throw fail('Collection not found', 404); c.name = String(payload.name ?? c.name).trim(); c.description = String(payload.description ?? c.description).trim(); if (!c.name) throw fail('Collection name is required'); await write(db); return c; }
export async function deleteCollection(id) { const db = await read(); requireAdmin(db); if (!(db.collections || []).some((x) => x.id === id)) throw fail('Collection not found', 404); db.collections = db.collections.filter((x) => x.id !== id); await write(db); return true; }
export async function addMemoryToCollection(id, memoryId) { const db = await read(); requireAdmin(db); const c = (db.collections || []).find((x) => x.id === id); const m = db.memories.find((x) => x.id === memoryId && x.status === STATUS.APPROVED); if (!c || !m) throw fail('Collection or approved memory not found', 404); if (!c.memoryIds.includes(memoryId)) c.memoryIds.push(memoryId); await write(db); return c; }
export async function removeMemoryFromCollection(id, memoryId) { const db = await read(); requireAdmin(db); const c = (db.collections || []).find((x) => x.id === id); if (!c) throw fail('Collection not found', 404); c.memoryIds = c.memoryIds.filter((x) => x !== memoryId); await write(db); return c; }
export async function getCollection(id) { const db = await read(); const c = (db.collections || []).find((x) => x.id === id); if (!c) throw fail('Collection not found', 404); const userId = session(db)?.id; return { ...c, memories: c.memoryIds.map((mid) => db.memories.find((m) => m.id === mid && m.status === STATUS.APPROVED)).filter(Boolean).map((m) => toClient(m, userId)) }; }
export async function getContributor(id) { const db = await read(); const memories = db.memories.filter((m) => m.contributor.id === id && m.status === STATUS.APPROVED); const user = db.users.find((u) => u.id === id); const name = user?.name || memories[0]?.contributor.name; if (!name) throw fail('Contributor not found', 404); const totalLikes = memories.reduce((sum, m) => sum + (m.likes || []).length, 0); const totals = new Map(); db.memories.filter((m) => m.status === STATUS.APPROVED).forEach((m) => totals.set(m.contributor.id, (totals.get(m.contributor.id) || 0) + (m.likes || []).length)); const topLikes = Math.max(0, ...totals.values()); return { id, name, batch: user?.batch || memories[0]?.batch || '', memories: memories.map((m) => toClient(m, session(db)?.id)), totalLikes, badges: [...(memories.length ? ['First Memory'] : []), ...(memories.length >= 5 ? ['5 Memories'] : []), ...(totalLikes > 0 && totalLikes === topLikes ? ['Most Liked'] : [])] }; }
export async function getCollectionsForMemory(memoryId) { const db = await read(); return (db.collections || []).filter((c) => c.memoryIds.includes(memoryId)).map(({ id, name }) => ({ id, name })); }

export async function toggleLike(id) {
  await delay(80);
  const db = await read();
  const u = requireUser(db);
  const m = db.memories.find((x) => x.id === id);
  if (!m) throw fail('Memory not found', 404);
  m.likes = m.likes.includes(u.id) ? m.likes.filter((x) => x !== u.id) : [...m.likes, u.id];
  if (m.likes.includes(u.id)) { (m.likeEvents ||= []).push({ userId: u.id, at: new Date().toISOString() }); notify(db, m.contributor.id, { type: 'like', memoryId: m.id, memoryTitle: m.title, actorId: u.id, actorName: u.name, text: `${u.name} liked your memory` }); }
  await write(db);
  return { liked: m.likes.includes(u.id), likesCount: m.likes.length };
}

export async function toggleReaction(id, emoji) {
  const valid = ['❤️', '😂', '😢', '🔥']; if (!valid.includes(emoji)) throw fail('Unsupported reaction');
  const db = await read(); const u = requireUser(db); const m = db.memories.find((x) => x.id === id);
  if (!m) throw fail('Memory not found', 404);
  m.reactions ||= { '❤️': [], '😂': [], '😢': [], '🔥': [] };
  const existing = Object.keys(m.reactions).find((key) => m.reactions[key].includes(u.id));
  if (existing === emoji) m.reactions[emoji] = m.reactions[emoji].filter((x) => x !== u.id);
  else {
    Object.keys(m.reactions).forEach((key) => { m.reactions[key] = m.reactions[key].filter((x) => x !== u.id); });
    m.reactions[emoji].push(u.id);
    notify(db, m.contributor.id, { type: 'reaction', memoryId: m.id, memoryTitle: m.title, actorId: u.id, actorName: u.name, text: `${u.name} reacted ${emoji} to your memory` });
  }
  await write(db); return toClient(m, u.id);
}
export async function setFeatured(id, featured) { const db = await read(); requireAdmin(db); const m = db.memories.find((x) => x.id === id); if (!m) throw fail('Memory not found', 404); m.featured = !!featured; await write(db); realtime.emit(EV.UPDATED, { memory: toClient(m), changed: ['featured'] }); return toClient(m); }

export async function addComment(id, text) {
  const db = await read(); const u = requireUser(db); const m = db.memories.find((x) => x.id === id);
  if (!m) throw fail('Memory not found', 404);
  const value = String(text || '').trim(); if (!value || value.length > 300) throw fail('Comment must be 1–300 characters');
  const comment = { id: uid('c'), userId: u.id, userName: u.name, text: value, createdAt: new Date().toISOString() };
  (m.comments ||= []).push(comment);
  notify(db, m.contributor.id, { type: 'comment', memoryId: m.id, memoryTitle: m.title, actorId: u.id, actorName: u.name, text: `${u.name} commented on your memory` });
  await write(db); return { comments: m.comments, comment };
}

export async function deleteComment(memoryId, commentId) {
  const db = await read(); const u = requireUser(db); const m = db.memories.find((x) => x.id === memoryId); const comment = m?.comments?.find((x) => x.id === commentId);
  if (!comment) throw fail('Comment not found', 404); if (comment.userId !== u.id && u.role !== ROLES.ADMIN) throw fail('You cannot delete this comment', 403);
  m.comments = m.comments.filter((x) => x.id !== commentId); await write(db); return m.comments;
}

export async function listNotifications() { const db = await read(); const u = requireUser(db); return (db.notifications || []).filter((n) => n.userId === u.id).slice(0, 100); }
export async function unreadCount() { return (await listNotifications()).filter((n) => !n.read).length; }
export async function markNotificationRead(id) { const db = await read(); const u = requireUser(db); const n = (db.notifications || []).find((x) => x.id === id && x.userId === u.id); if (n) n.read = true; await write(db); return n; }
export async function markAllRead() { const db = await read(); const u = requireUser(db); (db.notifications || []).filter((n) => n.userId === u.id).forEach((n) => { n.read = true; }); await write(db); return true; }

/* ---------------- admin ---------------- */
export async function adminList({ status = STATUS.PENDING, page = 1, limit = 20 } = {}) {
  await delay(200);
  const db = await read();
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
  const db = await read();
  requireAdmin(db);
  const m = db.memories.find((x) => x.id === id);
  if (!m) throw fail('Memory not found', 404);
  m.status = status;
  m.rejectReason = status === STATUS.REJECTED ? reason || 'Not suitable for the timeline' : null;
  await write(db);
  if (status === STATUS.APPROVED) realtime.emit(EV.PUBLISHED, toClient(m));
  realtime.emit(EV.REVIEWED, { id: m.id, title: m.title, status, reason: m.rejectReason, userId: m.contributor.id });
  return toClient(m);
}

export async function updateMemory(id, changes) {
  await delay(250);
  const db = await read();
  requireAdmin(db);
  const m = db.memories.find((x) => x.id === id);
  if (!m) throw fail('Memory not found', 404);
  const changed = [];
  ['year', 'eventDate', 'title', 'description', 'featured'].forEach((k) => {
    if (changes[k] !== undefined && changes[k] !== m[k]) { m[k] = k === 'year' ? Number(changes[k]) : changes[k]; changed.push(k === 'eventDate' ? 'date' : k); }
  });
  if (changed.includes('year')) m.batch = `Batch ${m.year}`;
  await write(db);
  if (m.status === STATUS.APPROVED && changed.length) realtime.emit(EV.UPDATED, { memory: toClient(m), changed });
  return toClient(m);
}
