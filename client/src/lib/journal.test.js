import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createVault, unlockWithPassphrase, unlockWithRecoveryKey, WrongSecretError, toBase64 } from './crypto';

// An in-memory stand-in for the API that behaves like server/routes/entries.js:
// legacy entries carry plaintext; a PUT with a sealed body replaces it.
const server = vi.hoisted(() => {
  const state = { entries: new Map(), nextId: 1, failUpdateOn: null, updates: 0 };
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const toClient = (e) => (e.enc
    ? { _id: e._id, date: e.date, enc: 1, body: e.body, files: e.files || null, versionCount: e.versions.length }
    : { _id: e._id, date: e.date, legacy: true, versionCount: e.versions.length, ...e.plain });
  const api = {
    list: async () => ({ data: { entries: [...state.entries.values()].map((e) => clone(toClient(e))) } }),
    versions: async (id) => ({ data: { versions: clone(state.entries.get(id).versions) } }),
    create: async ({ date, body, files }) => {
      const e = { _id: `e${state.nextId++}`, date, enc: 1, body, files, versions: [] };
      state.entries.set(e._id, e);
      return { data: { entry: clone(toClient(e)) } };
    },
    update: async (id, { body, files, versions, snapshot }) => {
      state.updates += 1;
      if (state.failUpdateOn === state.updates) throw new Error('Network error');
      const e = state.entries.get(id);
      if (!e.enc) {
        e.plain = undefined;
        e.versions = versions || [];
      } else if (snapshot) {
        e.versions.push({ body: e.body });
      }
      Object.assign(e, { enc: 1, body, files });
      return { data: { entry: clone(toClient(e)) } };
    },
    delete: async (id) => state.entries.delete(id),
  };
  return { state, api };
});

vi.mock('../api', () => ({ sealedEntriesAPI: server.api }));

const { entriesAPI, setJournalKey, encryptLegacyEntries, MigrationError } = await import('./journal');

function addLegacy(date, plain, versions = []) {
  const _id = `e${server.state.nextId++}`;
  server.state.entries.set(_id, { _id, date, plain, versions: versions.map((content) => ({ content, savedAt: '2025-01-01T00:00:00.000Z' })) });
  return _id;
}

const everything = {
  title: 'A full day',
  content: '<h2>Heading</h2><p><strong>Bold</strong>, <em>italic</em>, <mark>highlight</mark> and émoji 🎉</p><ul data-type="taskList"><li data-checked="true">done</li></ul>',
  grade: 10,
  emoji: 'confident',
  bgColor: '#1a2b3c',
  comments: [{ id: 'c1', text: 'Note to self', selectedText: 'Bold', createdAt: '2026-10-30T10:00:00.000Z' }],
  attachments: [
    { id: 'a1', name: 'photo.png', mimeType: 'image/png', size: 4, data: 'iVBORw==' },
    { id: 'a2', name: 'big.bin', mimeType: 'application/octet-stream', size: 2097152, data: toBase64(new Uint8Array(2097152).fill(42)) },
  ],
};

let key;
beforeEach(async () => {
  server.state.entries.clear();
  server.state.failUpdateOn = null;
  server.state.updates = 0;
  ({ journalKey: key } = await createVault('correct horse battery'));
  setJournalKey(key);
});

describe('entries', () => {
  it('round-trips every kind of field, including attachments', async () => {
    const { data } = await entriesAPI.create({ date: '2026-10-30', ...everything });
    const stored = server.state.entries.get(data.entry._id);
    expect(JSON.stringify(stored)).not.toContain('Note to self');
    expect(JSON.stringify(stored)).not.toContain('photo.png');

    const [entry] = (await entriesAPI.list()).data.entries;
    for (const [field, value] of Object.entries(everything)) expect(entry[field]).toEqual(value);
  });

  it('round-trips a minimal entry with defaults', async () => {
    await entriesAPI.create({ date: '2026-10-30', content: '<p>Just text</p>' });
    const [entry] = (await entriesAPI.list()).data.entries;
    expect(entry).toMatchObject({ title: '', content: '<p>Just text</p>', grade: 7, emoji: 'happy', bgColor: '', comments: [], attachments: [] });
  });

  it('keeps a version only when the text changed', async () => {
    const { data } = await entriesAPI.create({ date: '2026-10-30', content: '<p>one</p>' });
    await entriesAPI.list();
    await entriesAPI.update(data.entry._id, { date: '2026-10-30', content: '<p>one</p>', grade: 3 });
    await entriesAPI.update(data.entry._id, { date: '2026-10-30', content: '<p>two</p>' });
    const versions = (await entriesAPI.versions(data.entry._id, '2026-10-30')).data.versions;
    expect(versions.map((v) => v.content)).toEqual(['<p>one</p>']);
  });

  it('flags an entry it cannot decrypt instead of failing the whole list', async () => {
    await entriesAPI.create({ date: '2026-10-30', content: '<p>mine</p>' });
    setJournalKey((await createVault('another passphrase')).journalKey);
    const [entry] = (await entriesAPI.list()).data.entries;
    expect(entry.unreadable).toBe(true);
  });
});

describe('unlocking', () => {
  it('refuses a wrong passphrase and accepts the recovery key', async () => {
    const { vault, recoveryKey } = await createVault('correct horse battery');
    await expect(unlockWithPassphrase(vault, 'wrong horse battery')).rejects.toBeInstanceOf(WrongSecretError);
    const recovered = await unlockWithRecoveryKey(vault, recoveryKey);
    setJournalKey(recovered);
    await entriesAPI.create({ date: '2026-10-30', content: '<p>after recovery</p>' });
    expect((await entriesAPI.list()).data.entries[0].content).toBe('<p>after recovery</p>');
  });
});

describe('encrypting 1.x entries', () => {
  it('backs up first, then encrypts every legacy entry with its versions and attachments', async () => {
    const a = addLegacy('2025-01-01', { title: 'Old', content: '<p>first</p>', grade: 8, emoji: 'happy', attachments: everything.attachments, comments: everything.comments }, ['<p>draft</p>']);
    addLegacy('2025-01-02', { content: '<p>second</p>' });
    const saveBackup = vi.fn(async () => 'Documents/ArcJournal backups/x.json');

    const result = await encryptLegacyEntries({ saveBackup });

    expect(result).toEqual({ count: 2, backup: 'Documents/ArcJournal backups/x.json' });
    const backup = JSON.parse(saveBackup.mock.calls[0][0]);
    expect(backup.entries).toHaveLength(2);
    expect(backup.entries[0].entry.content).toBe('<p>first</p>');
    expect(backup.entries[0].versions[0].content).toBe('<p>draft</p>');
    expect(backup.entries[0].entry.attachments[1].data).toBe(everything.attachments[1].data);

    expect([...server.state.entries.values()].every((e) => e.enc === 1 && !e.plain)).toBe(true);
    const entries = (await entriesAPI.list()).data.entries;
    const first = entries.find((e) => e._id === a);
    expect(first).toMatchObject({ title: 'Old', content: '<p>first</p>', grade: 8, comments: everything.comments, attachments: everything.attachments });
    const versions = (await entriesAPI.versions(a, '2025-01-01')).data.versions;
    expect(versions[0].content).toBe('<p>draft</p>');
  });

  it('changes nothing when the backup cannot be saved', async () => {
    addLegacy('2025-01-01', { content: '<p>keep me</p>' });
    await expect(encryptLegacyEntries({ saveBackup: async () => { throw new Error('Disk full'); } })).rejects.toThrow('Disk full');
    await expect(encryptLegacyEntries({ saveBackup: async () => null })).rejects.toBeInstanceOf(MigrationError);
    expect([...server.state.entries.values()][0].plain.content).toBe('<p>keep me</p>');
    expect(server.state.updates).toBe(0);
  });

  it('resumes after an interruption without touching what was already done', async () => {
    addLegacy('2025-01-01', { content: '<p>one</p>' });
    addLegacy('2025-01-02', { content: '<p>two</p>' });
    addLegacy('2025-01-03', { content: '<p>three</p>' });
    server.state.failUpdateOn = 2;
    await expect(encryptLegacyEntries({ saveBackup: async () => 'b1' })).rejects.toThrow('Network error');

    const states = [...server.state.entries.values()].map((e) => (e.enc ? 'encrypted' : 'plaintext'));
    expect(states).toEqual(['encrypted', 'plaintext', 'plaintext']);
    expect([...server.state.entries.values()][1].plain.content).toBe('<p>two</p>');

    server.state.failUpdateOn = null;
    const result = await encryptLegacyEntries({ saveBackup: async () => 'b2' });
    expect(result.count).toBe(2);
    const contents = (await entriesAPI.list()).data.entries.map((e) => e.content).sort();
    expect(contents).toEqual(['<p>one</p>', '<p>three</p>', '<p>two</p>']);
  });

  it('does nothing and saves no backup when there is nothing to encrypt', async () => {
    await entriesAPI.create({ date: '2026-10-30', content: '<p>new</p>' });
    const saveBackup = vi.fn();
    expect(await encryptLegacyEntries({ saveBackup })).toEqual({ count: 0, backup: null });
    expect(saveBackup).not.toHaveBeenCalled();
  });

  it('keeps the old versions when a 1.x entry is edited before it was migrated', async () => {
    const id = addLegacy('2025-01-01', { content: '<p>now</p>' }, ['<p>before</p>']);
    await entriesAPI.list();
    await entriesAPI.update(id, { date: '2025-01-01', content: '<p>edited</p>' });
    expect(server.state.entries.get(id).enc).toBe(1);
    const versions = (await entriesAPI.versions(id, '2025-01-01')).data.versions;
    expect(versions.map((v) => v.content)).toEqual(['<p>before</p>']);
  });
});
