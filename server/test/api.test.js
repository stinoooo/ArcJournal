const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp } = require('../app');
const User = require('../models/User');
const Entry = require('../models/Entry');
const Warning = require('../models/Warning');
const LegacyBackup = require('../models/LegacyBackup');

process.env.JWT_SECRET = 'test-secret-for-password-sessions';

// Tokens look like "valid:<sub>". Anything else is rejected, like a bad signature.
const auth = {
  verifyToken: async (token) => (token.startsWith('valid:') ? { sub: token.slice(6) } : null),
  fetchProfile: async (token) => ({ email: `${token.slice(6)}@example.com`, name: `Name ${token.slice(6)}` }),
};

let mongo;
let app;

const as = (sub) => ({ Authorization: `Bearer valid:${sub}` });
const blob = (n = 1) => ({ iv: 'AAAAAAAAAAAAAAAA', ciphertext: Buffer.from(`sealed-${n}`).toString('base64') });
const vault = (n = 1) => ({
  version: 1,
  kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: 600000, salt: 'c2FsdHNhbHRzYWx0c2FsdA==' },
  passphrase: blob(n),
  recovery: blob(n + 100),
});
const today = () => new Date().toISOString().slice(0, 10);

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp({ auth });
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
  await User.syncIndexes();
});

test('requests without a valid token are refused', async () => {
  await request(app).get('/auth/me').expect(401);
  await request(app).get('/auth/me').set('Authorization', 'Bearer forged').expect(401);
});

test('first sign-in creates the account from the Arcnode profile', async () => {
  const res = await request(app).get('/auth/me').set(as('alice')).expect(200);
  assert.equal(res.body.user.email, 'alice@example.com');
  assert.equal(res.body.user.displayName, 'Name alice');
  assert.equal(res.body.user.hasVault, false);
  assert.equal(res.body.user.password, undefined);
  await request(app).get('/auth/me').set(as('alice')).expect(200);
  assert.equal(await User.countDocuments(), 1);
});


test('the vault is created once and replaced only on purpose', async () => {
  await request(app).put('/vault').set(as('alice')).send({ vault: { version: 1 } }).expect(400);
  const weak = { ...vault(), kdf: { ...vault().kdf, iterations: 1000 } };
  await request(app).put('/vault').set(as('alice')).send({ vault: weak }).expect(400);
  await request(app).put('/vault').set(as('alice')).send({ vault: vault(1) }).expect(200);
  await request(app).put('/vault').set(as('alice')).send({ vault: vault(2) }).expect(409);
  await request(app).put('/vault').set(as('alice')).send({ vault: vault(2), replace: true }).expect(200);
  const res = await request(app).get('/vault').set(as('alice')).expect(200);
  assert.equal(res.body.vault.passphrase.ciphertext, blob(2).ciphertext);
  const me = await request(app).get('/auth/me').set(as('alice')).expect(200);
  assert.equal(me.body.user.hasVault, true);
  assert.equal(me.body.user.vault, undefined);
});

test('entries must arrive encrypted', async () => {
  await request(app).post('/entries').set(as('alice')).send({ date: today(), content: 'plain text' }).expect(400);
  await request(app).post('/entries').set(as('alice')).send({ date: '2999-01-01', body: blob() }).expect(400);
  await request(app).post('/entries').set(as('alice')).send({ date: 'yesterday', body: blob() }).expect(400);
  const res = await request(app).post('/entries').set(as('alice')).send({ date: today(), body: blob() }).expect(201);
  assert.equal(res.body.entry.enc, 1);
  assert.deepEqual(res.body.entry.body, blob());
  const list = await request(app).get('/entries').query({ date: today() }).set(as('alice')).expect(200);
  assert.equal(list.body.entries.length, 1);
});

test('snapshots keep the last ten versions', async () => {
  const { body } = await request(app).post('/entries').set(as('alice')).send({ date: today(), body: blob(0) }).expect(201);
  const id = body.entry._id;
  for (let i = 1; i <= 12; i++) {
    await request(app).put(`/entries/${id}`).set(as('alice')).send({ body: blob(i), snapshot: true }).expect(200);
  }
  await request(app).put(`/entries/${id}`).set(as('alice')).send({ body: blob(13) }).expect(200);
  const res = await request(app).get(`/entries/${id}/versions`).set(as('alice')).expect(200);
  assert.equal(res.body.versions.length, 10);
  assert.deepEqual(res.body.versions.at(-1).body, blob(11));
});

test("one account cannot touch another account's entries", async () => {
  const { body } = await request(app).post('/entries').set(as('alice')).send({ date: today(), body: blob() }).expect(201);
  const id = body.entry._id;
  await request(app).put(`/entries/${id}`).set(as('bob')).send({ body: blob(2) }).expect(404);
  await request(app).delete(`/entries/${id}`).set(as('bob')).expect(404);
  await request(app).get(`/entries/${id}/versions`).set(as('bob')).expect(404);
  await request(app).get('/entries/not-an-id/versions').set(as('bob')).expect(404);
  const list = await request(app).get('/entries').set(as('bob')).expect(200);
  assert.equal(list.body.entries.length, 0);
});

test('encrypting a legacy entry removes every plaintext field', async () => {
  await request(app).get('/auth/me').set(as('alice'));
  const alice = await User.findOne({ arcnodeId: 'alice' });
  const legacy = await Entry.create({
    userId: alice._id, date: '2025-01-02', title: 'Old', content: '<p>secret</p>', grade: 8, emoji: 'happy',
    versions: [{ content: '<p>older secret</p>' }],
  });

  const list = await request(app).get('/entries').set(as('alice')).expect(200);
  assert.equal(list.body.entries[0].legacy, true);
  assert.equal(list.body.entries[0].content, '<p>secret</p>');

  await request(app)
    .put(`/entries/${legacy._id}`)
    .set(as('alice'))
    .send({ body: blob(1), versions: [{ body: blob(2), savedAt: '2025-01-02T10:00:00Z' }] })
    .expect(200);

  const raw = await mongoose.connection.db.collection('entries').findOne({ _id: legacy._id });
  for (const key of ['title', 'content', 'grade', 'emoji']) assert.equal(raw[key], undefined, key);
  assert.equal(raw.enc, 1);
  assert.equal(raw.versions.length, 1);
  assert.equal(raw.versions[0].content, undefined);
  assert.deepEqual(raw.versions[0].body, blob(2));
});

test('suspended accounts lose journal access but can see their status and appeal', async () => {
  await request(app).get('/auth/me').set(as('mallory'));
  await User.updateOne({ arcnodeId: 'mallory' }, { status: 'suspended', statusReason: 'Spam' });

  const me = await request(app).get('/auth/me').set(as('mallory')).expect(200);
  assert.equal(me.body.user.status, 'suspended');
  const blocked = await request(app).get('/entries').set(as('mallory')).expect(403);
  assert.equal(blocked.body.code, 'account_suspended');
  await request(app).post('/entries').set(as('mallory')).send({ date: today(), body: blob() }).expect(403);
  await request(app).get('/vault').set(as('mallory')).expect(403);
  await request(app).delete('/user').set(as('mallory')).expect(403);
  await request(app).post('/appeals').set(as('mallory')).send({ message: 'Please review my suspension.' }).expect(201);
});

test('a suspension with an end date lifts itself', async () => {
  await request(app).get('/auth/me').set(as('carol'));
  await User.updateOne({ arcnodeId: 'carol' }, { status: 'suspended', statusExpiry: new Date(Date.now() - 1000) });
  const me = await request(app).get('/auth/me').set(as('carol')).expect(200);
  assert.equal(me.body.user.status, 'active');
  await request(app).get('/entries').set(as('carol')).expect(200);
});

async function legacyAccount(fields = {}) {
  return User.create({
    email: 'old@example.com',
    username: 'oldname',
    password: await bcrypt.hash('correct horse', 4),
    displayName: 'Old Me',
    onboardingComplete: true,
    createdAt: new Date('2024-05-01T00:00:00Z'),
    ...fields,
  });
}

test('linking a legacy account moves its journal and removes it', async () => {
  const old = await legacyAccount({ role: 'admin' });
  await Entry.create({ userId: old._id, date: '2024-06-01', content: '<p>hi</p>' });
  await Warning.create({ userId: old._id, reason: 'Be kind' });

  await request(app).post('/user/link-legacy').set(as('alice')).send({ identifier: 'oldname', password: 'wrong' }).expect(401);
  const res = await request(app)
    .post('/user/link-legacy')
    .set(as('alice'))
    .send({ identifier: 'OldName', password: 'correct horse' })
    .expect(200);

  assert.equal(res.body.legacyEntries, 1);
  assert.equal(res.body.user.role, 'admin');
  assert.equal(res.body.user.onboardingComplete, true);
  assert.equal(new Date(res.body.user.createdAt).toISOString(), '2024-05-01T00:00:00.000Z');
  assert.equal(await User.countDocuments({ _id: old._id }), 0);
  const alice = await User.findOne({ arcnodeId: 'alice' });
  assert.equal(await Entry.countDocuments({ userId: alice._id }), 1);
  assert.equal(await Warning.countDocuments({ userId: alice._id }), 1);

  // The legacy account is gone, so it cannot be linked twice.
  await request(app).post('/user/link-legacy').set(as('bob')).send({ identifier: 'oldname', password: 'correct horse' }).expect(401);
});

test('linking cannot be used to escape a moderation action', async () => {
  await legacyAccount({ status: 'terminated', statusReason: 'Abuse' });
  const res = await request(app)
    .post('/user/link-legacy')
    .set(as('alice'))
    .send({ identifier: 'old@example.com', password: 'correct horse' })
    .expect(200);
  assert.equal(res.body.user.status, 'terminated');
  await request(app).get('/entries').set(as('alice')).expect(403);
});

test('admins see activity, never journal contents', async () => {
  await request(app).get('/auth/me').set(as('admin'));
  await User.updateOne({ arcnodeId: 'admin' }, { role: 'admin' });
  await request(app).post('/entries').set(as('alice')).send({ date: today(), body: blob() }).expect(201);
  const alice = await User.findOne({ arcnodeId: 'alice' });

  await request(app).get(`/admin/users/${alice._id}/stats`).set(as('alice')).expect(403);
  const res = await request(app).get(`/admin/users/${alice._id}/stats`).set(as('admin')).expect(200);
  assert.equal(res.body.stats.totalEntries, 1);
  assert.equal(res.body.stats.avgGrade, null);
  assert.equal(res.body.stats.encrypted, true);

  const search = await request(app).get('/admin/users').query({ search: '(a+)+$' }).set(as('admin')).expect(200);
  assert.equal(search.body.users.length, 0);
});

test('resetting the vault deletes the journal it protected', async () => {
  await request(app).put('/vault').set(as('alice')).send({ vault: vault() }).expect(200);
  await request(app).post('/entries').set(as('alice')).send({ date: today(), body: blob() }).expect(201);
  await request(app).post('/vault/reset').set(as('alice')).send({}).expect(400);
  await request(app).post('/vault/reset').set(as('alice')).send({ confirm: 'DELETE MY JOURNAL' }).expect(200);
  assert.equal(await Entry.countDocuments(), 0);
  const res = await request(app).get('/vault').set(as('alice')).expect(200);
  assert.equal(res.body.vault, null);
});

// ── 1.x accounts keep their password until they link ─────────

const login = (identifier, password, client = 'arcjournal-2') =>
  request(app).post('/auth/login').send({ identifier, password, client });

test('unlinked 1.x accounts sign in with their password in 2.0', async () => {
  const old = await legacyAccount();
  await Entry.create({ userId: old._id, date: '2024-06-01', content: '<p>hi</p>' });

  await login('oldname', 'wrong').expect(401);
  await request(app).post('/auth/signup').send({}).expect(410);
  const res = await login('OLD@example.com', 'correct horse').expect(200);
  const session = { Authorization: `Bearer ${res.body.token}` };

  const me = await request(app).get('/auth/me').set(session).expect(200);
  assert.equal(me.body.session, 'password');
  assert.equal(me.body.user.arcnodeId, undefined);
  const list = await request(app).get('/entries').set(session).expect(200);
  assert.equal(list.body.entries[0].legacy, true);
  // Password sessions can also set up encryption and migrate.
  await request(app).put('/vault').set(session).send({ vault: vault() }).expect(200);
});

test('tokens from 1.x apps are refused, so those apps are told to update', async () => {
  const old = await legacyAccount();
  const { SignJWT } = await import('jose');
  const oldStyle = await new SignJWT({ userId: String(old._id) })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));
  await request(app).get('/auth/me').set('Authorization', `Bearer ${oldStyle}`).expect(426);
  const res = await login('oldname', 'correct horse', null).expect(426);
  assert.equal(res.body.code, 'upgrade_required');
});

test('linking from a password session moves the account to Arcnode and retires the password', async () => {
  const old = await legacyAccount({ role: 'admin' });
  const { body } = await login('oldname', 'correct horse').expect(200);
  const session = { Authorization: `Bearer ${body.token}` };

  await request(app).post('/user/link-arcnode').set(session).send({ accessToken: 'forged' }).expect(400);
  const res = await request(app).post('/user/link-arcnode').set(session).send({ accessToken: 'valid:alice' }).expect(200);
  assert.equal(String(res.body.user._id), String(old._id));
  assert.equal(res.body.user.arcnodeId, 'alice');
  assert.equal(res.body.user.role, 'admin');

  const raw = await User.findById(old._id).lean();
  assert.equal(raw.password, undefined);
  // The password session and password sign-in stop working; Arcnode works.
  await request(app).get('/auth/me').set(session).expect(401);
  await login('oldname', 'correct horse').expect(401);
  const me = await request(app).get('/auth/me').set(as('alice')).expect(200);
  assert.equal(String(me.body.user._id), String(old._id));
});

test('linking into an Arcnode account that already uses ArcJournal merges the two', async () => {
  await request(app).get('/auth/me').set(as('alice'));
  const old = await legacyAccount();
  await Entry.create({ userId: old._id, date: '2024-06-01', content: '<p>hi</p>' });
  const { body } = await login('oldname', 'correct horse').expect(200);
  const res = await request(app)
    .post('/user/link-arcnode')
    .set('Authorization', `Bearer ${body.token}`)
    .send({ accessToken: 'valid:alice' })
    .expect(200);
  assert.equal(res.body.user.arcnodeId, 'alice');
  assert.equal(await User.countDocuments({ _id: old._id }), 0);
  assert.equal(await Entry.countDocuments({ userId: res.body.user._id }), 1);
});

test('two encrypted journals are never merged by accident', async () => {
  await request(app).put('/vault').set(as('alice')).send({ vault: vault(1) }).expect(200);
  await legacyAccount({ vault: { ...vault(5), updatedAt: new Date() } });
  const res = await request(app)
    .post('/user/link-legacy')
    .set(as('alice'))
    .send({ identifier: 'oldname', password: 'correct horse' })
    .expect(409);
  assert.equal(res.body.code, 'link_conflict');
  assert.equal(await User.countDocuments({ username: 'oldname' }), 1);
});

test('the plaintext is snapshotted on the server before an entry is encrypted', async () => {
  await request(app).get('/auth/me').set(as('alice'));
  const alice = await User.findOne({ arcnodeId: 'alice' });
  const original = await Entry.create({
    userId: alice._id, date: '2025-01-02', title: 'Old', content: '<p>secret</p>', grade: 8,
    attachments: [{ id: 'a1', name: 'x.txt', data: 'aGk=' }], versions: [{ content: '<p>older</p>' }],
  });

  await request(app).put(`/entries/${original._id}`).set(as('alice')).send({ body: blob(1) }).expect(200);
  // A retried migration request must not overwrite the snapshot with ciphertext.
  await request(app).put(`/entries/${original._id}`).set(as('alice')).send({ body: blob(2) }).expect(200);

  const backup = await LegacyBackup.findOne({ entryId: original._id }).lean();
  assert.equal(backup.entry.content, '<p>secret</p>');
  assert.equal(backup.entry.attachments[0].data, 'aGk=');
  assert.equal(backup.entry.versions[0].content, '<p>older</p>');

  await request(app).post('/vault/reset').set(as('alice')).send({ confirm: 'DELETE MY JOURNAL' }).expect(200);
  assert.equal(await LegacyBackup.countDocuments(), 0);
});

// ── 2.0.1: what a 1.x app actually sends ─────────────────────

test('a 1.x app (file:// origin) gets the download-2.0 message, not a failed preflight', async () => {
  for (const origin of ['file://', 'null']) {
    const pre = await request(app)
      .options('/auth/login')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type')
      .expect(204);
    assert.equal(pre.headers['access-control-allow-origin'], origin);

    const res = await request(app)
      .post('/auth/login')
      .set('Origin', origin)
      .send({ identifier: 'oldname', password: 'whatever' })
      .expect(426);
    assert.equal(res.headers['access-control-allow-origin'], origin);
    assert.match(res.body.error, /arcnode\.dev\/downloads/);
  }
});

test('a signed-in 1.x app is told to update instead of "session expired"', async () => {
  const old = await legacyAccount();
  const { SignJWT } = await import('jose');
  const oldToken = await new SignJWT({ userId: String(old._id) })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));
  const res = await request(app)
    .get('/auth/me')
    .set('Origin', 'file://')
    .set('Authorization', `Bearer ${oldToken}`)
    .expect(426);
  assert.equal(res.body.code, 'upgrade_required');
  assert.equal(res.headers['access-control-allow-origin'], 'file://');
});

test('file:// and null origins only reach /auth', async () => {
  const res = await request(app).get('/entries').set('Origin', 'null').set(as('alice'));
  assert.equal(res.headers['access-control-allow-origin'], undefined);
});

test('deleting a migrated entry deletes its server-side safety copy', async () => {
  await request(app).get('/auth/me').set(as('alice'));
  const alice = await User.findOne({ arcnodeId: 'alice' });
  const old = await Entry.create({ userId: alice._id, date: '2025-01-02', content: '<p>secret</p>' });
  await request(app).put(`/entries/${old._id}`).set(as('alice')).send({ body: blob(1) }).expect(200);
  assert.equal(await LegacyBackup.countDocuments({ entryId: old._id }), 1);
  await request(app).delete(`/entries/${old._id}`).set(as('alice')).expect(200);
  assert.equal(await LegacyBackup.countDocuments({ entryId: old._id }), 0);
});

test('a rejected migration leaves no safety copy behind', async () => {
  await request(app).get('/auth/me').set(as('alice'));
  const alice = await User.findOne({ arcnodeId: 'alice' });
  const old = await Entry.create({ userId: alice._id, date: '2025-01-02', content: '<p>secret</p>' });
  await request(app)
    .put(`/entries/${old._id}`)
    .set(as('alice'))
    .send({ body: blob(1), versions: [{ body: { iv: 'x', ciphertext: 'not sealed' } }] })
    .expect(400);
  assert.equal(await LegacyBackup.countDocuments(), 0);
  const raw = await mongoose.connection.db.collection('entries').findOne({ _id: old._id });
  assert.equal(raw.content, '<p>secret</p>');
});

test('a password sign-in for an unknown account fails like a wrong password', async () => {
  const res = await login('nobody-at-all', 'whatever').expect(401);
  assert.match(res.body.error, /do not match/);
});
