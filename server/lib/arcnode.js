/**
 * Sign-in with an Arcnode account. The desktop app signs in through Backboard
 * (OAuth 2.0 with PKCE) and sends the access token as a Bearer token. The token
 * is verified locally against Backboard's published keys, so a Backboard outage
 * pauses new sign-ins but never breaks a signed-in session.
 *
 * A token is accepted only when the RS256 signature verifies, the issuer is
 * Backboard, it is an access token, it has not expired, and it was issued to
 * the ArcJournal client (the audience).
 */
const ISSUER = process.env.ARCNODE_ISSUER || 'https://backboard.arcnode.dev';
const JWKS_URL = process.env.ARCNODE_JWKS_URL || `${ISSUER}/.well-known/jwks.json`;

function createVerifier({ issuer = ISSUER, audience, keys }) {
  return async (token) => {
    if (!audience) return null;
    const { jwtVerify } = await import('jose');
    try {
      const { payload } = await jwtVerify(token, keys, {
        issuer,
        audience,
        algorithms: ['RS256'],
        clockTolerance: 30,
      });
      if (payload.token_use !== 'access' || typeof payload.sub !== 'string' || !payload.sub) return null;
      return { sub: payload.sub };
    } catch {
      return null;
    }
  };
}

async function remoteKeys(url = JWKS_URL) {
  const { createRemoteJWKSet } = await import('jose');
  return createRemoteJWKSet(new URL(url), { cacheMaxAge: 10 * 60_000, cooldownDuration: 30_000 });
}

/** Name and email for a new account, read once from Backboard's userinfo endpoint. */
async function fetchProfile(token, issuer = ISSUER) {
  const res = await fetch(`${issuer}/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const info = await res.json();
  return { email: typeof info.email === 'string' ? info.email : '', name: typeof info.name === 'string' ? info.name : '' };
}

module.exports = { createVerifier, remoteKeys, fetchProfile, ISSUER };
