import React, { createContext, useContext, useEffect, useState } from 'react';

import { getCurrentUser, loginUser, logoutUser, registerUser } from '../services/auth';

const TOKEN_KEY = 'ambisense:authToken';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getCurrentUser(token)
      .then(({ user: currentUser }) => {
        if (!cancelled) setUser(currentUser);
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  function saveSession(data) {
    localStorage.setItem(TOKEN_KEY, data.authToken);
    setToken(data.authToken);
    setUser(data.user);
    return data.user;
  }

  async function login(email, password) {
    return saveSession(await loginUser(email, password));
  }

  async function register(name, email, password) {
    return saveSession(await registerUser(name, email, password));
  }

  async function logout() {
    try {
      if (token) await logoutUser(token);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider.');
  }
  return context;
}
