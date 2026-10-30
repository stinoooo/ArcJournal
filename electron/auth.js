/**
 * "Sign in with Arcnode" for a desktop app: OAuth 2.0 authorization code flow
 * with PKCE through the system browser (RFC 8252). ArcJournal is a public
 * client, so it has no secret; the browser redirects back to a one-off server
 * on 127.0.0.1. The refresh token is kept encrypted with the OS keychain
 * (safeStorage) and never reaches the renderer.
 */
const http = require('http');
const crypto = require('crypto');
const { shell } = require('electron');
const secrets = require('./secrets');
const { arcnode } = require('../package.json');

const ISSUER = process.env.ARCNODE_ISSUER || arcnode.issuer;
const CLIENT_ID = process.env.ARCJOURNAL_CLIENT_ID || arcnode.clientId;
// Backboard matches redirect URIs exactly; the second port is the fallback.
const PORTS = arcnode.redirectPorts;
const SCOPE = 'openid profile email';
const SIGN_IN_TIMEOUT = 5 * 60 * 1000;
const SESSION = 'arcnode-session';

const b64url = (buf) => buf.toString('base64url');

let access = null; // { token, expiresAt }
let refreshing = null;
let pending = null; // the sign-in waiting for the browser

class AuthError extends Error {}

async function tokenRequest(params) {
  const res = await fetch(`${ISSUER}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...params }),
    signal: AbortSignal.timeout(15000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new AuthError(body.error_description || 'Sign-in failed');
    err.code = body.error;
    throw err;
  }
  return body;
}

function store(tokens) {
  access = { token: tokens.access_token, expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000 };
  if (tokens.refresh_token) secrets.write(SESSION, tokens.refresh_token);
}

function listen(server) {
  return new Promise((resolve, reject) => {
    let i = 0;
    const tryNext = () => {
      if (i >= PORTS.length) return reject(new AuthError('Close other apps signing in to Arcnode and try again.'));
      const port = PORTS[i++];
      server.once('error', tryNext);
      server.listen(port, '127.0.0.1', () => {
        server.off('error', tryNext);
        resolve(port);
      });
    };
    tryNext();
  });
}

const page = (title, text) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<style>body{margin:0;height:100vh;display:grid;place-items:center;background:#0B1020;color:#E8ECF5;font:16px system-ui,sans-serif}
main{text-align:center;max-width:420px;padding:24px}h1{font-size:22px;margin:0 0 8px}p{color:#9AA6C2;margin:0}</style></head>
<body><main><h1>${title}</h1><p>${text}</p></main></body></html>`;

/** Opens the browser and resolves once the user approved ArcJournal. */
async function signIn() {
  if (!CLIENT_ID) throw new AuthError('This build of ArcJournal has no Arcnode client ID.');
  cancel();

  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
  const state = b64url(crypto.randomBytes(16));

  return new Promise((resolve, reject) => {
    const server = http.createServer();
    let redirectUri;
    const finish = (err) => {
      clearTimeout(timer);
      server.close();
      pending = null;
      if (err) reject(err);
      else resolve(true);
    };
    const timer = setTimeout(() => finish(new AuthError('Sign-in timed out. Try again.')), SIGN_IN_TIMEOUT);
    pending = { cancel: () => finish(new AuthError('Sign-in cancelled.')) };

    server.on('request', async (req, res) => {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname !== '/callback') { res.writeHead(404).end(); return; }
      const reply = (status, title, text) => {
        res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(page(title, text));
      };
      if (url.searchParams.get('state') !== state) {
        reply(400, 'Something went wrong', 'This sign-in link is not the one ArcJournal opened. Start again from the app.');
        return;
      }
      // RFC 9207: when the server names itself, it must be Backboard.
      const iss = url.searchParams.get('iss');
      if (iss && iss !== ISSUER) {
        reply(400, 'Something went wrong', 'This sign-in did not come from Arcnode. Start again from the app.');
        finish(new AuthError('Sign-in failed.'));
        return;
      }
      const code = url.searchParams.get('code');
      if (!code) {
        reply(400, 'Sign-in cancelled', 'You can close this tab and return to ArcJournal.');
        finish(new AuthError(url.searchParams.get('error') === 'access_denied' ? 'Sign-in cancelled.' : 'Sign-in failed.'));
        return;
      }
      try {
        const tokens = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, code_verifier: verifier });
        store(tokens);
        reply(200, 'You are signed in', 'You can close this tab and return to ArcJournal.');
        finish();
      } catch (err) {
        reply(500, 'Sign-in failed', 'Return to ArcJournal and try again.');
        finish(err);
      }
    });

    listen(server)
      .then((port) => {
        redirectUri = `http://127.0.0.1:${port}/callback`;
        const authorize = new URL(`${ISSUER}/oauth/authorize`);
        authorize.search = new URLSearchParams({
          response_type: 'code',
          client_id: CLIENT_ID,
          redirect_uri: redirectUri,
          scope: SCOPE,
          state,
          code_challenge: challenge,
          code_challenge_method: 'S256',
        }).toString();
        return shell.openExternal(authorize.toString());
      })
      .catch(finish);
  });
}

function cancel() {
  pending?.cancel();
}

/** A valid access token, refreshed when it is about to expire. Null when signed out. */
async function getAccessToken() {
  if (access && access.expiresAt - Date.now() > 60_000) return access.token;
  const refreshToken = secrets.read(SESSION);
  if (!refreshToken) return null;
  // Refresh tokens rotate, so concurrent requests share one refresh.
  refreshing ??= tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken })
    .then((tokens) => { store(tokens); return access.token; })
    .catch((err) => {
      if (err instanceof AuthError) { signOut(); return null; }
      throw err; // offline: keep the session
    })
    .finally(() => { refreshing = null; });
  return refreshing;
}

function isSignedIn() {
  return !!secrets.read(SESSION);
}

function signOut() {
  access = null;
  secrets.remove(SESSION);
}

module.exports = { signIn, cancel, getAccessToken, isSignedIn, signOut };
