export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const GOOGLE_LOGIN_ENABLED = !USE_MOCK && Boolean(GOOGLE_CLIENT_ID);
export const TOKEN_KEY = 'cdm_token';

export const STATUS = { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' };
export const ROLES = { STUDENT: 'student', ADMIN: 'admin' };

export const SOCKET_EVENTS = {
  NEW: 'memory:new',
  DUPLICATE: 'memory:duplicate',
  PUBLISHED: 'memory:published',
  UPDATED: 'memory:updated',
  REVIEWED: 'memory:reviewed',
  NOTIFY: 'notification:new',
};

export const START_YEAR = 2018;
export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: CURRENT_YEAR - START_YEAR + 1 }, (_, i) => CURRENT_YEAR - i);
export const BATCHES = YEARS.map((y) => `Batch ${y}`);

export const PAGE_SIZE = 9;
export const MAX_IMAGES = 4;

export const MEMORY_TYPES = [
  { value: 'event', label: 'Event', emoji: '🎉' },
  { value: 'project', label: 'Project', emoji: '🛠️' },
  { value: 'achievement', label: 'Achievement', emoji: '🏆' },
  { value: 'cultural', label: 'Cultural', emoji: '🎭' },
  { value: 'learning', label: 'Learning', emoji: '📚' },
  { value: 'infrastructure', label: 'Campus upgrade', emoji: '🏗️' },
];
export const typeMeta = (v) => MEMORY_TYPES.find((t) => t.value === v) || MEMORY_TYPES[0];
