import api from './axiosInstance';
import * as mock from './mockServer';
import { USE_MOCK } from '../utils/constants';

const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v != null));

// Images are compressed data-URLs in the browser; send them as real files to the backend.
async function toFormData(p) {
  const fd = new FormData();
  Object.entries(p).forEach(([k, v]) => { if (k !== 'images' && k !== 'tags') fd.append(k, v ?? ''); });
  (p.tags || []).forEach((t) => fd.append('tags[]', t));
  for (const [i, src] of (p.images || []).entries()) fd.append('images', await (await fetch(src)).blob(), `photo-${i}.jpg`);
  return fd;
}

/* ---- public / student ---- */
export const list = (params) => (USE_MOCK ? mock.listMemories(params) : api.get('/memories', { params: clean(params) }));
export const getStats = () => (USE_MOCK ? mock.getStats() : api.get('/memories/stats'));
export const getById = (id) => (USE_MOCK ? mock.getMemory(id) : api.get(`/memories/${id}`));
export const checkDuplicates = (body) => (USE_MOCK ? mock.checkDuplicates(body) : api.post('/memories/check-duplicates', body));
export const create = async (body) => (USE_MOCK ? mock.createMemory(body) : api.post('/memories', await toFormData(body)));
export const mine = () => (USE_MOCK ? mock.myMemories() : api.get('/memories/mine'));
export const toggleLike = (id) => (USE_MOCK ? mock.toggleLike(id) : api.post(`/memories/${id}/like`));
export const addComment = (id, text) => (USE_MOCK ? mock.addComment(id, text) : api.post(`/memories/${id}/comments`, { text }));
export const deleteComment = (id, commentId) => (USE_MOCK ? mock.deleteComment(id, commentId) : api.delete(`/memories/${id}/comments/${commentId}`));
export const toggleReaction = (id, emoji) => (USE_MOCK ? mock.toggleReaction(id, emoji) : api.post(`/memories/${id}/reactions`, { emoji }));
export const listNotifications = () => (USE_MOCK ? mock.listNotifications() : api.get('/notifications'));
export const unreadCount = () => (USE_MOCK ? mock.unreadCount() : api.get('/notifications/unread-count'));
export const markNotificationRead = (id) => (USE_MOCK ? mock.markNotificationRead(id) : api.patch(`/notifications/${id}/read`));
export const markAllRead = () => (USE_MOCK ? mock.markAllRead() : api.patch('/notifications/read-all'));
export const setFeatured = (id, featured) => (USE_MOCK ? mock.setFeatured(id, featured) : api.patch(`/admin/memories/${id}/featured`, { featured }));
export const listFeatured = () => (USE_MOCK ? mock.listFeatured() : api.get('/memories/featured'));
export const createCollection = (body) => (USE_MOCK ? mock.createCollection(body) : api.post('/admin/collections', body));
export const addToCollection = (id, memoryId) => (USE_MOCK ? mock.addToCollection(id, memoryId) : api.post(`/admin/collections/${id}/memories`, { memoryId }));
export const listCollections = () => (USE_MOCK ? mock.listCollections() : api.get('/collections'));
export const getCollection = (id) => (USE_MOCK ? mock.getCollection(id) : api.get(`/collections/${id}`));
export const getContributor = (id) => (USE_MOCK ? mock.getContributor(id) : api.get(`/users/${id}/profile`));
export const editOwn = (id, body) => (USE_MOCK ? mock.editOwnMemory(id, body) : api.patch(`/memories/${id}`, body));
export const deleteOwn = (id) => (USE_MOCK ? mock.deleteOwnMemory(id) : api.delete(`/memories/${id}`));
export const report = (id, reason) => (USE_MOCK ? mock.reportMemory(id, reason) : api.post(`/memories/${id}/report`, { reason }));
export const listFlagged = () => (USE_MOCK ? mock.listFlagged() : api.get('/admin/memories/flagged'));

/* ---- admin ---- */
export const adminList = (params) => (USE_MOCK ? mock.adminList(params) : api.get('/admin/memories', { params }));
export const review = (id, body) => (USE_MOCK ? mock.reviewMemory(id, body) : api.patch(`/admin/memories/${id}/review`, body));
export const update = (id, body) => (USE_MOCK ? mock.updateMemory(id, body) : api.patch(`/admin/memories/${id}`, body));
