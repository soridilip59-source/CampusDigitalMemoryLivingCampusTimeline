import axios from 'axios';
import { API_URL, TOKEN_KEY } from '../utils/constants';

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

// attach JWT
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// unwrap data, handle 401, retry GETs with backoff when the server is busy (429/503/network)
api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const cfg = err.config;
    const status = err.response?.status;
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('auth:logout'));
    }
    if (cfg && cfg.method === 'get' && (!status || status === 429 || status === 503) && (cfg.__retry || 0) < 2) {
      cfg.__retry = (cfg.__retry || 0) + 1;
      await new Promise((r) => setTimeout(r, 400 * 2 ** cfg.__retry));
      return api(cfg);
    }
    return Promise.reject(Object.assign(new Error(err.response?.data?.message || err.message || 'Something went wrong'), { status }));
  },
);

export default api;
