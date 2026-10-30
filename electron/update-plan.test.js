const { test } = require('node:test');
const assert = require('node:assert/strict');
const { newer, installKind, pickAsset, parseSums } = require('./update-plan');

test('compares versions numerically', () => {
  assert.equal(newer('2.0.1', '2.0.0'), true);
  assert.equal(newer('2.10.0', '2.9.9'), true);
  assert.equal(newer('2.0.0', '2.0.0'), false);
  assert.equal(newer('1.9.9', '2.0.0'), false);
});

test('works out how this copy was installed', () => {
  const none = () => false;
  assert.deepEqual(installKind({ platform: 'win32', execPath: 'C:\\x\\arcjournal.exe', exists: none }), { kind: 'squirrel' });
  assert.deepEqual(
    installKind({ platform: 'darwin', execPath: '/Applications/ArcJournal.app/Contents/MacOS/arcjournal', exists: none }),
    { kind: 'mac-app', target: '/Applications/ArcJournal.app' },
  );
  assert.deepEqual(
    installKind({ platform: 'linux', execPath: '/usr/lib/arcjournal/arcjournal', exists: (p) => p === '/var/lib/dpkg/info/arcjournal.list' }),
    { kind: 'deb' },
  );
  assert.deepEqual(
    installKind({ platform: 'linux', execPath: '/usr/lib/arcjournal/arcjournal', exists: (p) => p === '/var/lib/rpm' }),
    { kind: 'rpm' },
  );
  assert.deepEqual(
    installKind({ platform: 'linux', execPath: '/home/me/apps/ArcJournal-linux-x64/arcjournal', exists: none }),
    { kind: 'portable', target: '/home/me/apps/ArcJournal-linux-x64' },
  );
});

test('picks the release file for each kind of install', () => {
  const assets = [
    'ArcJournal-2.1.0-Setup.exe',
    'ArcJournal-darwin-universal-2.1.0.zip',
    'ArcJournal-2.1.0-universal.dmg',
    'ArcJournal-linux-x64-2.1.0.zip',
    'arcjournal_2.1.0_amd64.deb',
    'arcjournal-2.1.0-1.x86_64.rpm',
    'SHA256SUMS',
  ].map((name) => ({ name }));
  assert.equal(pickAsset(assets, 'mac-app', '2.1.0').name, 'ArcJournal-darwin-universal-2.1.0.zip');
  assert.equal(pickAsset(assets, 'portable', '2.1.0').name, 'ArcJournal-linux-x64-2.1.0.zip');
  assert.equal(pickAsset(assets, 'deb', '2.1.0').name, 'arcjournal_2.1.0_amd64.deb');
  assert.equal(pickAsset(assets, 'rpm', '2.1.0').name, 'arcjournal-2.1.0-1.x86_64.rpm');
  assert.equal(pickAsset(assets, 'deb', '2.2.0'), null);
  assert.equal(pickAsset(assets, 'manual', '2.1.0'), null);
});

test('reads sha256sum output', () => {
  const hash = 'a'.repeat(64);
  const sums = parseSums(`${hash}  arcjournal_2.1.0_amd64.deb\n${'b'.repeat(64)} *ArcJournal-2.1.0-Setup.exe\nnot a line\n`);
  assert.equal(sums.get('arcjournal_2.1.0_amd64.deb'), hash);
  assert.equal(sums.get('ArcJournal-2.1.0-Setup.exe'), 'b'.repeat(64));
  assert.equal(sums.size, 2);
});

test('trusts checksums only with a valid release signature', () => {
  const crypto = require('crypto');
  const { verifySums, RELEASE_PUBLIC_KEY } = require('./update-plan');
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const pub = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  const sums = `${'a'.repeat(64)}  arcjournal_2.0.1_amd64.deb\n`;
  const sig = crypto.sign(null, Buffer.from(sums), privateKey).toString('base64');

  assert.equal(verifySums(sums, sig, pub), true);
  assert.equal(verifySums(sums.replace('a', 'b'), sig, pub), false, 'a changed checksum');
  assert.equal(verifySums(sums, sig), false, 'signed by another key than the one in the app');
  assert.equal(verifySums(sums, 'not base64 at all', pub), false);
  assert.match(RELEASE_PUBLIC_KEY, /^MCow/);
});
