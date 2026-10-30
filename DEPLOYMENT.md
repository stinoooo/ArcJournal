# Deployment

## API on Railway

The API is the `ArcJournal` service in the Arcnode project on Railway (region
`europe-west4`), with the `ArcJournal MongoDB` service next to it. It deploys from `main`
at [arcjournal-production.up.railway.app](https://arcjournal-production.up.railway.app/health).

[`railway.json`](railway.json) builds with `npm ci --prefix server --omit=dev` (the desktop tooling at the root is
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
| `JWT_SECRET` | Keep the existing value. It signs password sessions for 1.x accounts that are not linked yet. |

`JWT_EXPIRES_IN` is no longer read and can be removed.

### What happens on the first 2.0 start

- Indexes are synced: email is no longer unique and usernames only exist on 1.x accounts.
- The `wraps` collection from 1.x is dropped. It held entry titles and grades in plaintext,
  and wraps are now computed in the app.
- 1.x accounts and entries stay as they are. Their owners keep signing in with their password
  in 2.0 until they connect an Arcnode account; only then is the password removed.
- ArcJournal 1.x apps get `426 Upgrade Required` with a link to the download page. Their
  saved sessions are not accepted by 2.0.

## Encrypting 1.x journals, and undoing it

The app encrypts a 1.x journal right after its owner sets a passphrase:

1. It saves a full plaintext export (entries, versions, attachments) to
   `Documents/ArcJournal backups` on that computer. Nothing is encrypted if that fails.
2. It seals each entry, opens it again and checks it matches the original exactly.
3. The server copies the plaintext entry into `legacybackups`, then replaces it with the
   ciphertext. One entry at a time, so an interruption leaves each entry either untouched or
   fully encrypted, and the next unlock continues where it stopped.

Server snapshots expire after 90 days and are deleted with the journal or the account. To put
a user's 1.x entries back exactly as they were (support only):

```bash
node server/scripts/restore-legacy-backup.js <email or user id> --dry-run
node server/scripts/restore-legacy-backup.js <email or user id>
```

The app encrypts the restored entries again on the next unlock.

Before deploying 2.0, take a manual backup of the `ArcJournal MongoDB` volume in Railway as well.

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

Updates are automatic once a release is published:

- Windows picks it up from [update.electronjs.org](https://github.com/electron/update.electronjs.org),
  which reads the published GitHub releases.
- macOS and Linux read the latest release from the GitHub API, download the file for their kind of
  install (universal zip, Linux zip, `.deb` or `.rpm`), and only apply it when its SHA-256 matches
  `SHA256SUMS`, which the release workflow adds after the builds. A release without `SHA256SUMS`
  is offered as a download link instead. See [`electron/updates.js`](electron/updates.js).

The arcnode.dev downloads page resolves the latest release itself through
`/api/download/arcjournal`.

### macOS signing

The macOS build is not signed or notarized yet, so Gatekeeper asks for confirmation on the
first launch. Squirrel.Mac needs a signed app, so ArcJournal updates itself on macOS instead. Signing needs an Apple Developer
account; Forge's `osxSign` and `osxNotarize` options in `forge.config.js` take it from there.
