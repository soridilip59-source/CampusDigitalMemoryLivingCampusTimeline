export const uid = (p = 'id') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const normalize = (s = '') =>
  String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const STOP = new Set(['the', 'and', 'for', 'with', 'our', 'from', 'that', 'this', 'was', 'were', 'campus']);
const tokens = (s) => new Set(normalize(s).split(' ').filter((w) => w.length > 2 && !STOP.has(w)));

/** Jaccard similarity between two strings (0..1) — basic duplicate-matching rule */
export function similarity(a, b) {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let hit = 0;
  A.forEach((w) => B.has(w) && hit++);
  return hit / (A.size + B.size - hit);
}

export const initials = (name = '?') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export const cx = (...c) => c.filter(Boolean).join(' ');
