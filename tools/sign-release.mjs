// Signs a release's SHA256SUMS with the ArcJournal release key and uploads
// SHA256SUMS.sig, after the release workflow has built and uploaded the rest.
// The app installs macOS and Linux updates only when this signature verifies.
//
//   node tools/sign-release.mjs v2.0.1
//
// The key is read from %USERPROFILE%\.arcnode\arcjournal-release-key.pem and
// never leaves this computer; nothing about it is printed.
import { execFileSync } from 'node:child_process';
import { createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import plan from '../electron/update-plan.js';

const tag = process.argv[2];
if (!/^v\d+\.\d+\.\d+$/.test(tag || '')) throw new Error('Usage: node tools/sign-release.mjs v<version>');
const repo = 'stinoooo/ArcJournal';
const dir = mkdtempSync(join(tmpdir(), 'arcjournal-sign-'));
const gh = (...args) => execFileSync('gh', args, { cwd: dir, stdio: ['ignore', 'pipe', 'inherit'] });

gh('release', 'download', tag, '--repo', repo, '--pattern', 'SHA256SUMS');
const sums = readFileSync(join(dir, 'SHA256SUMS'), 'utf8');
const key = createPrivateKey(readFileSync(join(homedir(), '.arcnode', 'arcjournal-release-key.pem')));
// Refuse to sign with a key that does not match the public key in the app.
const embedded = createPublicKey({ key: Buffer.from(plan.RELEASE_PUBLIC_KEY, 'base64'), format: 'der', type: 'spki' });
const signature = sign(null, Buffer.from(sums, 'utf8'), key);
if (!verify(null, Buffer.from(sums, 'utf8'), embedded, signature)) throw new Error('The key does not match the app');
if (!plan.verifySums(sums, signature.toString('base64'))) throw new Error('Self-check failed');

writeFileSync(join(dir, 'SHA256SUMS.sig'), signature.toString('base64') + '\n');
gh('release', 'upload', tag, join(dir, 'SHA256SUMS.sig'), '--repo', repo, '--clobber');
console.log(`Signed SHA256SUMS for ${tag} (${sums.trim().split('\n').length} files) and uploaded SHA256SUMS.sig`);
