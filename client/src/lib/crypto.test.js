import { describe, it, expect } from 'vitest';
import {
  createVault,
  unlockWithPassphrase,
  unlockWithRecoveryKey,
  changePassphrase,
  rotateRecoveryKey,
  exportJournalKey,
  importJournalKey,
  seal,
  open,
  formatRecoveryKey,
  parseRecoveryKey,
  WrongSecretError,
  toBase64,
} from './crypto';

describe('vault', () => {
  it('opens with the passphrase and with the recovery key, to the same journal key', async () => {
    const { vault, journalKey, recoveryKey } = await createVault('correct horse battery');
    const original = await exportJournalKey(journalKey);
    expect(await exportJournalKey(await unlockWithPassphrase(vault, 'correct horse battery'))).toBe(original);
    expect(await exportJournalKey(await unlockWithRecoveryKey(vault, recoveryKey))).toBe(original);
  });

  it('refuses a wrong passphrase or recovery key', async () => {
    const { vault } = await createVault('correct horse battery');
    await expect(unlockWithPassphrase(vault, 'Correct horse battery')).rejects.toBeInstanceOf(WrongSecretError);
    const other = await createVault('something else entirely');
    await expect(unlockWithRecoveryKey(vault, other.recoveryKey)).rejects.toBeInstanceOf(WrongSecretError);
  });

  it('never stores the passphrase or the key in the vault', async () => {
    const { vault, journalKey } = await createVault('correct horse battery');
    const text = JSON.stringify(vault);
    expect(text).not.toContain('correct horse');
    expect(text).not.toContain(await exportJournalKey(journalKey));
    expect(vault.kdf.iterations).toBeGreaterThanOrEqual(600000);
  });

  it('changes the passphrase without changing the journal key', async () => {
    const { vault, journalKey, recoveryKey } = await createVault('first passphrase');
    const next = await changePassphrase(vault, journalKey, 'second passphrase');
    await expect(unlockWithPassphrase(next, 'first passphrase')).rejects.toBeInstanceOf(WrongSecretError);
    const key = await unlockWithPassphrase(next, 'second passphrase');
    expect(await exportJournalKey(key)).toBe(await exportJournalKey(journalKey));
    // The recovery key keeps working.
    await unlockWithRecoveryKey(next, recoveryKey);
  });

  it('retires the old recovery key when a new one is made', async () => {
    const { vault, journalKey, recoveryKey } = await createVault('first passphrase');
    const rotated = await rotateRecoveryKey(vault, journalKey);
    await expect(unlockWithRecoveryKey(rotated.vault, recoveryKey)).rejects.toBeInstanceOf(WrongSecretError);
    await unlockWithRecoveryKey(rotated.vault, rotated.recoveryKey);
  });
});

describe('recovery key format', () => {
  it('round-trips and forgives case, spaces and look-alike letters', () => {
    const bytes = new Uint8Array(32).map((_, i) => (i * 37 + 11) & 255);
    const text = formatRecoveryKey(bytes);
    expect(text.replace(/-/g, '')).toHaveLength(52);
    expect(parseRecoveryKey(text)).toEqual(bytes);
    const sloppy = text.toLowerCase().replace(/-/g, ' ').replace(/0/g, 'o').replace(/1/g, 'l');
    expect(parseRecoveryKey(sloppy)).toEqual(bytes);
  });

  it('rejects text that is not a recovery key', () => {
    expect(() => parseRecoveryKey('hello')).toThrow(WrongSecretError);
  });
});

describe('sealing', () => {
  it('round-trips values and binds them to their context', async () => {
    const { journalKey } = await createVault('correct horse battery');
    const value = { title: 'Day one', content: '<p>Hello 👋</p>', grade: 8 };
    const sealed = await seal(journalKey, value, 'arcjournal:entry:v1:body:2026-10-30');
    expect(sealed.iv).toHaveLength(16);
    expect(sealed.ciphertext).not.toContain('Hello');
    expect(await open(journalKey, sealed, 'arcjournal:entry:v1:body:2026-10-30')).toEqual(value);
    // Moving a sealed entry to another day makes it unreadable.
    await expect(open(journalKey, sealed, 'arcjournal:entry:v1:body:2026-10-31')).rejects.toThrow();
  });

  it('uses a fresh nonce every time', async () => {
    const { journalKey } = await createVault('correct horse battery');
    const a = await seal(journalKey, 'same', 'ctx');
    const b = await seal(journalKey, 'same', 'ctx');
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('handles large attachments', async () => {
    const { journalKey } = await createVault('correct horse battery');
    const big = toBase64(new Uint8Array(3 * 1024 * 1024).fill(7));
    expect(await open(journalKey, await seal(journalKey, [{ data: big }], 'files'), 'files')).toEqual([{ data: big }]);
  });

  it('works with a key restored from this device', async () => {
    const { journalKey } = await createVault('correct horse battery');
    const restored = await importJournalKey(await exportJournalKey(journalKey));
    expect(await open(restored, await seal(journalKey, 42, 'ctx'), 'ctx')).toBe(42);
  });
});
