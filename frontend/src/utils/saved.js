const key = (userId) => `cdm_saved_${userId}`;
export const getSaved = (userId) => { try { return JSON.parse(localStorage.getItem(key(userId)) || '[]'); } catch { return []; } };
export const toggleSaved = (userId, id) => { const current = getSaved(userId); const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]; localStorage.setItem(key(userId), JSON.stringify(next)); window.dispatchEvent(new Event('cdm:saved')); return next; };
