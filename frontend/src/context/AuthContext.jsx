import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/authApi';
import { TOKEN_KEY, ROLES } from '../utils/constants';
import { realtime } from '../utils/realtime';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  // restore session
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authApi.getMe().then((r) => setUser(r.user)).catch(logout).finally(() => setLoading(false));
  }, [logout]);

  // backend said 401 somewhere
  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);

  useEffect(() => {
    if (!user) {
      realtime.setToken(null);
      return undefined;
    }
    realtime.setToken(localStorage.getItem(TOKEN_KEY));
    return () => realtime.disconnect();
  }, [user?.id]);

  const startSession = useCallback(({ token, user: u }) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
    return u;
  }, []);

  const login = useCallback(async (body) => startSession(await authApi.login(body)), [startSession]);
  const register = useCallback(async (body) => startSession(await authApi.register(body)), [startSession]);
  const loginWithGoogle = useCallback(
    async (credential) => startSession(await authApi.googleLogin(credential)),
    [startSession],
  );

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === ROLES.ADMIN, login, register, loginWithGoogle, logout }),
    [user, loading, login, register, loginWithGoogle, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
