export const savedKey = (userId) => `cdm_saved_${userId}`;
export const readSaved = (userId) => { try { return JSON.parse(localStorage.getItem(savedKey(userId)) || '[]'); } catch { return []; } };
export const toggleSaved = (userId, memoryId) => { const next = readSaved(userId); const result = next.includes(memoryId) ? next.filter((id) => id !== memoryId) : [...next, memoryId]; localStorage.setItem(savedKey(userId), JSON.stringify(result)); return result; };
