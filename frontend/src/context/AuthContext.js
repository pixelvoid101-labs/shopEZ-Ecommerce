import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'shopez-auth';

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('shopez-token'));

  useEffect(() => {
    if (authUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [authUser]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('shopez-token', token);
    } else {
      localStorage.removeItem('shopez-token');
    }
  }, [token]);

  const login = (user, authToken) => {
    setAuthUser(user);
    setToken(authToken);
  };

  const logout = () => {
    setAuthUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({ authUser, token, login, logout }),
    [authUser, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
