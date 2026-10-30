import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, userAPI, onSignedOut } from '../api';
import { setJournalKey } from '../lib/journal';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  // 'arcnode', or 'password' for a 1.x account that is not linked yet
  const [session, setSession] = useState(null);

  const loadUser = useCallback(async () => {
    try {
      const signedIn = await window.electronAPI?.auth.isSignedIn();
      if (!signedIn) { setUser(null); return; }
      const res = await authAPI.me();
      setUser(res.data.user);
      setSession(res.data.session);
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

  const signInWithPassword = async (identifier, password) => {
    const { data } = await authAPI.login(identifier, password);
    await window.electronAPI.auth.setPasswordSession(data.token);
    setLoading(true);
    await loadUser();
  };

  // A 1.x account signed in with its password connects its Arcnode account.
  // The Arcnode session only takes over once the server confirmed the link.
  const linkArcnode = async () => {
    const accessToken = await window.electronAPI.auth.startLink();
    try {
      const { data } = await userAPI.linkArcnode(accessToken);
      await window.electronAPI.auth.finishLink();
      setUser(data.user);
      setSession('arcnode');
    } catch (err) {
      await window.electronAPI.auth.discardLink();
      throw err;
    }
  };

  const logout = async () => {
    setJournalKey(null);
    await window.electronAPI?.auth.signOut();
    setUser(null);
  };

  const refreshUser = loadUser;

  return (
    <AuthContext.Provider value={{ user, setUser, session, loading, offline, signIn, signInWithPassword, linkArcnode, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
