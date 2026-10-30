import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { vaultAPI } from '../api';
import { useAuth } from './AuthContext';
import {
  createVault,
  unlockWithPassphrase,
  unlockWithRecoveryKey,
  changePassphrase as rewrap,
  rotateRecoveryKey,
  exportJournalKey,
  importJournalKey,
} from '../lib/crypto';
import { setJournalKey, encryptLegacyEntries } from '../lib/journal';

const VaultContext = createContext(null);

// Ties a remembered key to the vault it came from. A new recovery key or a
// reset vault changes this, and the device asks for the passphrase again.
const stampOf = (vault) => vault.recovery.ciphertext;

export function VaultProvider({ children }) {
  const { user } = useAuth();
  const [vault, setVault] = useState(null);
  const [state, setState] = useState('loading'); // loading | setup | locked | unlocked | error
  const [migration, setMigration] = useState(null); // { done, total } while encrypting 1.x entries
  const remembering = window.electronAPI?.vault;

  const open = useCallback(async (key, currentVault) => {
    setJournalKey(key);
    setState('unlocked');
    try {
      await encryptLegacyEntries((done, total) => setMigration(total ? { done, total } : null));
    } catch {
      // Tried again on the next unlock.
    } finally {
      setMigration(null);
    }
    return currentVault;
  }, []);

  const load = useCallback(async () => {
    if (!user || user.status !== 'active') return;
    setState('loading');
    try {
      const { data } = await vaultAPI.get();
      setVault(data.vault);
      if (!data.vault) { setState('setup'); return; }
      const saved = await remembering?.recall(String(user._id));
      if (saved) {
        const { key, stamp } = JSON.parse(saved);
        if (stamp === stampOf(data.vault)) { await open(await importJournalKey(key), data.vault); return; }
        await remembering.forget(String(user._id));
      }
      setState('locked');
    } catch {
      setState('error');
    }
  }, [user?._id, user?.status, open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const remember = async (key, v, yes) => {
    if (!remembering) return;
    if (yes) await remembering.remember(String(user._id), JSON.stringify({ key: await exportJournalKey(key), stamp: stampOf(v) }));
    else await remembering.forget(String(user._id));
  };

  const setup = async (passphrase, keepUnlocked) => {
    const created = await createVault(passphrase);
    const { data } = await vaultAPI.save(created.vault);
    setVault(data.vault);
    await remember(created.journalKey, data.vault, keepUnlocked);
    return { recoveryKey: created.recoveryKey, finish: () => open(created.journalKey, data.vault) };
  };

  const unlock = async (passphrase, keepUnlocked) => {
    const key = await unlockWithPassphrase(vault, passphrase);
    await remember(key, vault, keepUnlocked);
    await open(key, vault);
  };

  // Forgot the passphrase: the recovery key opens the journal and sets a new one.
  const recover = async (recoveryKey, newPassphrase) => {
    const key = await unlockWithRecoveryKey(vault, recoveryKey);
    const { data } = await vaultAPI.save(await rewrap(vault, key, newPassphrase), true);
    setVault(data.vault);
    await open(key, data.vault);
  };

  const changePassphrase = async (currentPassphrase, newPassphrase) => {
    const key = await unlockWithPassphrase(vault, currentPassphrase);
    const { data } = await vaultAPI.save(await rewrap(vault, key, newPassphrase), true);
    setVault(data.vault);
  };

  const newRecoveryKey = async (currentPassphrase) => {
    const key = await unlockWithPassphrase(vault, currentPassphrase);
    const rotated = await rotateRecoveryKey(vault, key);
    const { data } = await vaultAPI.save(rotated.vault, true);
    setVault(data.vault);
    if (await remembering?.recall(String(user._id))) await remember(key, data.vault, true);
    return rotated.recoveryKey;
  };

  const lock = async () => {
    setJournalKey(null);
    await remembering?.forget(String(user._id));
    setState('locked');
  };

  // Last resort: nobody can decrypt the journal anymore, so it is deleted.
  const reset = async () => {
    await vaultAPI.reset();
    setJournalKey(null);
    await remembering?.forget(String(user._id));
    setVault(null);
    setState('setup');
  };

  return (
    <VaultContext.Provider value={{
      state, vault, migration, canRemember: !!remembering,
      setup, unlock, recover, changePassphrase, newRecoveryKey, lock, reset, retry: load,
    }}>
      {children}
    </VaultContext.Provider>
  );
}

export const useVault = () => {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within VaultProvider');
  return ctx;
};
