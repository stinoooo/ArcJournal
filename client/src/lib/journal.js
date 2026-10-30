/**
 * The decrypted journal. Pages call entriesAPI and statsAPI exactly as they did
 * before end-to-end encryption; this module seals everything on the way out and
 * opens it on the way in, with the journal key held only in memory.
 */
import { sealedEntriesAPI } from '../api';
import { seal, open } from './crypto';
import { computeStats } from './stats';

let journalKey = null;

export function setJournalKey(key) {
  journalKey = key;
}

export function hasJournalKey() {
  return journalKey !== null;
}

function requireKey() {
  if (!journalKey) throw new Error('Unlock your journal first');
  return journalKey;
}

const bodyContext = (date) => `arcjournal:entry:v1:body:${date}`;
const filesContext = (date) => `arcjournal:entry:v1:files:${date}`;

const EMPTY = { title: '', content: '', grade: 7, emoji: 'happy', bgColor: '', comments: [], attachments: [] };

function bodyOf(data) {
  return {
    title: data.title || '',
    content: data.content || '',
    grade: data.grade ?? 7,
    emoji: data.emoji || 'happy',
    bgColor: data.bgColor || '',
    comments: data.comments || [],
  };
}

async function sealEntry(date, data) {
  const key = requireKey();
  const attachments = data.attachments || [];
  return {
    body: await seal(key, bodyOf(data), bodyContext(date)),
    files: attachments.length ? await seal(key, attachments, filesContext(date)) : null,
  };
}

// Last known text per entry, to decide when an edit deserves a version snapshot.
const lastContent = new Map();
// Entries still in 1.x plaintext. Saving one encrypts it, so its old
// versions are sealed and sent along instead of being dropped.
const legacyIds = new Set();

async function openEntry(raw) {
  const meta = {
    _id: raw._id,
    date: raw.date,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    lastEditedAt: raw.lastEditedAt,
    versionCount: raw.versionCount,
  };
  if (raw.legacy) {
    const entry = { ...EMPTY, ...meta, ...Object.fromEntries(Object.entries(raw).filter(([, v]) => v != null)), legacy: true };
    lastContent.set(raw._id, entry.content);
    legacyIds.add(raw._id);
    return entry;
  }
  const key = requireKey();
  try {
    const body = await open(key, raw.body, bodyContext(raw.date));
    const attachments = raw.files ? await open(key, raw.files, filesContext(raw.date)) : [];
    lastContent.set(raw._id, body.content);
    return { ...EMPTY, ...meta, ...body, attachments };
  } catch {
    return { ...EMPTY, ...meta, unreadable: true, title: 'This entry could not be decrypted' };
  }
}

async function openAll(raws) {
  return Promise.all(raws.map(openEntry));
}

export const entriesAPI = {
  async list(params) {
    const res = await sealedEntriesAPI.list(params);
    return { data: { entries: await openAll(res.data.entries) } };
  },

  async create(data) {
    const res = await sealedEntriesAPI.create({ date: data.date, ...(await sealEntry(data.date, data)) });
    return { data: { entry: await openEntry(res.data.entry) } };
  },

  async update(id, data) {
    const snapshot = lastContent.has(id) && lastContent.get(id) !== (data.content || '');
    let versions;
    if (legacyIds.has(id)) {
      const key = requireKey();
      const { data: old } = await sealedEntriesAPI.versions(id);
      versions = [];
      for (const v of old.versions) {
        if (v.content == null) continue;
        versions.push({ body: await seal(key, bodyOf({ ...data, content: v.content }), bodyContext(data.date)), savedAt: v.savedAt });
      }
    }
    const res = await sealedEntriesAPI.update(id, { ...(await sealEntry(data.date, data)), snapshot, ...(versions ? { versions } : {}) });
    legacyIds.delete(id);
    return { data: { entry: await openEntry(res.data.entry) } };
  },

  async versions(id, date) {
    const res = await sealedEntriesAPI.versions(id);
    const key = requireKey();
    const out = [];
    for (const v of res.data.versions) {
      if (v.body) {
        try {
          out.push({ ...(await open(key, v.body, bodyContext(date))), savedAt: v.savedAt });
        } catch { /* skip versions that no longer open */ }
      } else if (v.content != null) {
        out.push({ content: v.content, savedAt: v.savedAt });
      }
    }
    return { data: { versions: out } };
  },

  delete(id) {
    lastContent.delete(id);
    return sealedEntriesAPI.delete(id);
  },
};

export const statsAPI = {
  async get(params, memberSince) {
    const { data } = await entriesAPI.list(params);
    return { data: { stats: computeStats(data.entries.filter((e) => !e.unreadable), { memberSince }) } };
  },
};

export class MigrationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MigrationError';
  }
}

// Same value, same JSON: what was sealed must open to exactly what was there.
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Encrypts every entry ArcJournal 1.x stored in plaintext, safely:
 *
 * 1. Saves a full plaintext export of those entries and their versions on this
 *    device (saveBackup must resolve with where it went). Nothing is encrypted
 *    if that fails.
 * 2. Seals each entry and its versions, then opens them again and checks they
 *    match the original exactly before sending them. The server keeps its own
 *    snapshot of the plaintext before replacing it (see the server's LegacyBackup).
 * 3. One entry at a time, so an interruption leaves every entry either fully
 *    plaintext or fully encrypted. Running it again picks up the rest.
 *
 * Resolves with { count, backup }.
 */
export async function encryptLegacyEntries({ onProgress = () => {}, saveBackup }) {
  const key = requireKey();
  const res = await sealedEntriesAPI.list();
  const legacy = res.data.entries.filter((e) => e.legacy);
  if (!legacy.length) return { count: 0, backup: null };

  const full = [];
  for (const raw of legacy) {
    const { data } = await sealedEntriesAPI.versions(raw._id);
    full.push({ entry: raw, versions: data.versions.filter((v) => v.content != null) });
  }
  const backup = await saveBackup(JSON.stringify({
    app: 'ArcJournal',
    kind: 'Plaintext backup of ArcJournal 1.x entries, made before encrypting them',
    exportedAt: new Date().toISOString(),
    entries: full,
  }, null, 2));
  if (!backup) throw new MigrationError('The backup could not be saved, so nothing was encrypted.');

  let done = 0;
  onProgress(done, legacy.length);
  for (const { entry: raw, versions: oldVersions } of full) {
    const body = bodyOf(raw);
    const attachments = raw.attachments || [];
    const sealed = await sealEntry(raw.date, raw);
    const versions = [];
    for (const v of oldVersions) {
      const versionBody = bodyOf({ ...raw, content: v.content });
      const sealedVersion = await seal(key, versionBody, bodyContext(raw.date));
      if (!same(await open(key, sealedVersion, bodyContext(raw.date)), versionBody)) {
        throw new MigrationError(`A version of your entry from ${raw.date} did not encrypt correctly. Nothing was changed for it.`);
      }
      versions.push({ body: sealedVersion, savedAt: v.savedAt });
    }
    const openedBody = await open(key, sealed.body, bodyContext(raw.date));
    const openedFiles = sealed.files ? await open(key, sealed.files, filesContext(raw.date)) : [];
    if (!same(openedBody, body) || !same(openedFiles, attachments)) {
      throw new MigrationError(`Your entry from ${raw.date} did not encrypt correctly. Nothing was changed for it.`);
    }
    await sealedEntriesAPI.update(raw._id, { ...sealed, versions });
    onProgress(++done, legacy.length);
  }
  return { count: legacy.length, backup };
}
