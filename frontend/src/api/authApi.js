import api from './axiosInstance';
import * as mock from './mockServer';
import { USE_MOCK } from '../utils/constants';

// Expected backend: POST /auth/login, POST /auth/register -> { token, user }, GET /auth/me -> { user }
export const login = (body) => (USE_MOCK ? mock.login(body) : api.post('/auth/login', body));
export const register = (body) => (USE_MOCK ? mock.register(body) : api.post('/auth/register', body));
export const googleLogin = (credential) => (
  USE_MOCK
    ? Promise.reject(new Error('Google login requires the real backend. Set VITE_USE_MOCK=false.'))
    : api.post('/auth/google', { credential })
);
export const getMe = () => (USE_MOCK ? mock.me() : api.get('/auth/me'));
