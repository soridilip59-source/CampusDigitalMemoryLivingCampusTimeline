import { io } from 'socket.io-client';
import { SOCKET_EVENTS, SOCKET_URL, USE_MOCK } from './constants';

/**
 * Mock mode broadcasts between tabs; real mode receives authenticated Socket.IO events.
 */
const listeners = new Map();
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('cdm-realtime') : null;
let socket;

const dispatch = (event, payload) => (listeners.get(event) || []).forEach((cb) => cb(payload));
if (channel) channel.onmessage = (e) => dispatch(e.data.event, e.data.payload);

export const realtime = {
  setToken(token) {
    if (USE_MOCK) return;
    socket?.disconnect();
    socket = null;
    if (!token) return;
    socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socket.onAny(dispatch);
  },
  disconnect() {
    socket?.disconnect();
    socket = null;
  },
  emit(event, payload) {
    if (!USE_MOCK) return;
    dispatch(event, payload);
    channel?.postMessage({ event, payload });
  },
  on(event, cb) {
    listeners.set(event, [...(listeners.get(event) || []), cb]);
    return () => listeners.set(event, (listeners.get(event) || []).filter((f) => f !== cb));
  },
};

export const EV = SOCKET_EVENTS;
