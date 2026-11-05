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

/* ---- admin ---- */
export const adminList = (params) => (USE_MOCK ? mock.adminList(params) : api.get('/admin/memories', { params }));
export const review = (id, body) => (USE_MOCK ? mock.reviewMemory(id, body) : api.patch(`/admin/memories/${id}/review`, body));
export const update = (id, body) => (USE_MOCK ? mock.updateMemory(id, body) : api.patch(`/admin/memories/${id}`, body));
