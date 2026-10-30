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
    const res = await sealedEntriesAPI.update(id, { ...(await sealEntry(data.date, data)), snapshot });
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

/**
 * Encrypts every entry still stored in plaintext by ArcJournal 1.x, including
 * its saved versions, then the server deletes the plaintext. Reports progress
 * as (done, total).
 */
export async function encryptLegacyEntries(onProgress = () => {}) {
  const key = requireKey();
  const res = await sealedEntriesAPI.list();
  const legacy = res.data.entries.filter((e) => e.legacy);
  let done = 0;
  onProgress(done, legacy.length);
  for (const raw of legacy) {
    const { data } = await sealedEntriesAPI.versions(raw._id);
    const versions = [];
    for (const v of data.versions) {
      if (v.content == null) continue;
      versions.push({ body: await seal(key, bodyOf({ ...raw, content: v.content }), bodyContext(raw.date)), savedAt: v.savedAt });
    }
    await sealedEntriesAPI.update(raw._id, { ...(await sealEntry(raw.date, raw)), versions });
    onProgress(++done, legacy.length);
  }
  return legacy.length;
}
