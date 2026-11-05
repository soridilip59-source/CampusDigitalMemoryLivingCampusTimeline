import { SOCKET_EVENTS } from './constants';

/**
 * Tiny pub/sub that mimics Socket.IO.
 * - Mock mode: BroadcastChannel syncs events between browser tabs (open 2 tabs: student + admin).
 * - When the backend is ready: replace the body of emit/on with socket.io-client
 *   (socket.on(event, cb) / socket.off(event, cb)). Nothing else in the app changes.
 */
const listeners = new Map();
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('cdm-realtime') : null;

const dispatch = (event, payload) => (listeners.get(event) || []).forEach((cb) => cb(payload));
if (channel) channel.onmessage = (e) => dispatch(e.data.event, e.data.payload);

export const realtime = {
  emit(event, payload) {
    dispatch(event, payload);
    channel?.postMessage({ event, payload });
  },
  on(event, cb) {
    listeners.set(event, [...(listeners.get(event) || []), cb]);
    return () => listeners.set(event, (listeners.get(event) || []).filter((f) => f !== cb));
  },
};

export const EV = SOCKET_EVENTS;
