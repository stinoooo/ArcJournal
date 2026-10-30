import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, onSignedOut } from '../api';
import { setJournalKey } from '../lib/journal';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const signedIn = await window.electronAPI?.auth.isSignedIn();
      if (!signedIn) { setUser(null); return; }
      const res = await authAPI.me();
      setUser(res.data.user);
      setOffline(false);
    } catch (err) {
      // No connection: keep the session, show a retry instead of signing out.
      if (!err.response) setOffline(true);
      else setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  useEffect(() => onSignedOut(() => {
    setJournalKey(null);
    setUser(null);
  }), []);

  // Opens arcnode.dev in the browser and resolves once the user approved.
  const signIn = async () => {
    await window.electronAPI.auth.signIn();
    setLoading(true);
    await loadUser();
  };

  const logout = async () => {
    setJournalKey(null);
    await window.electronAPI?.auth.signOut();
    setUser(null);
  };

  const refreshUser = loadUser;

  return (
    <AuthContext.Provider value={{ user, setUser, loading, offline, signIn, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
