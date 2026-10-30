# Deployment

## API on Railway

The API is the `ArcJournal` service in the Arcnode project on Railway (region
`europe-west4`), with the `ArcJournal MongoDB` service next to it. It deploys from `main`
at [arcjournal-production.up.railway.app](https://arcjournal-production.up.railway.app/health).

[`railway.json`](railway.json) installs only `server/` (the desktop tooling at the root is
not needed there), starts `node server/index.js` and waits for `/health`. Railway reads the
Node.js version from `engines` in the root `package.json`.

### Variables

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | Reference to the `ArcJournal MongoDB` connection URL. |
| `ARCJOURNAL_CLIENT_ID` | The ArcJournal OAuth client ID from Backboard (below). |
| `ARCNODE_ISSUER` | `https://backboard.arcnode.dev` (the default). |
| `ARCNODE_JWKS_URL` | `https://backboard.arcnode.dev/.well-known/jwks.json` (the default). |
| `CORS_ORIGINS` | Leave empty. The app's `app://arcjournal` origin is always allowed. |

`JWT_SECRET` and `JWT_EXPIRES_IN` belonged to the 1.x password sign-in and can be removed.

### What happens on the first 2.0 start

- Indexes are synced: email is no longer unique and usernames only exist on 1.x accounts.
- The `wraps` collection from 1.x is dropped. It held entry titles and grades in plaintext,
  and wraps are now computed in the app.
- 1.x accounts and entries stay as they are until their owner links them to an Arcnode
  account. The app then encrypts the entries and the server deletes the plaintext.
- ArcJournal 1.x apps get `426 Upgrade Required` with a link to the download page.

## Arcnode sign-in (Backboard)

ArcJournal is an OAuth client in Backboard. Register it once at
[backboard.arcnode.dev/oauth-clients](https://backboard.arcnode.dev/oauth-clients) (owner or
admin):

| Field | Value |
| --- | --- |
| Name | ArcJournal |
| Type | Public (PKCE, no secret) |
| Redirect URIs | `http://127.0.0.1:47825/callback` and `http://127.0.0.1:47826/callback` |
| Scopes | `openid`, `profile`, `email` |

Put the client ID in `package.json` under `arcnode.clientId` (the app reads it from there) and
in `ARCJOURNAL_CLIENT_ID` on Railway. Backboard shows a secret once at registration; ArcJournal
does not use it, so do not store it.

## Desktop releases

1. Update the version in `package.json`, `client/package.json` and `server/package.json`, and
   add the release to [`CHANGELOG.md`](CHANGELOG.md).
2. Merge to `main`. Railway deploys the API.
3. Tag the merge commit: `git tag v<version> && git push origin v<version>`.
4. The [release workflow](.github/workflows/release.yml) builds Windows (Squirrel), macOS
   (universal `.dmg` and `.zip`) and Linux (`.deb`, `.rpm`, `.zip`) and uploads them to a
   draft release.
5. Check the draft, then publish it.

Windows installs pick the update up from
[update.electronjs.org](https://github.com/electron/update.electronjs.org), which reads the
published GitHub releases. macOS and Linux builds show a banner that opens the release page.

The arcnode.dev downloads page resolves the latest release itself through
`/api/download/arcjournal`.

### macOS signing

The macOS build is not signed or notarized yet, so Gatekeeper asks for confirmation on the
first launch and automatic updates are not possible there. Signing needs an Apple Developer
account; Forge's `osxSign` and `osxNotarize` options in `forge.config.js` take it from there.
