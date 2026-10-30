# Changelog

## 2.1.0 (2026-10-30)

### Changed

- ArcJournal signs in with Arcnode only. The **Sign in with your ArcJournal 1.x password**
  option is gone, along with connecting an Arcnode account from a password sign-in. If you used
  1.x, sign in with Arcnode and choose **Bring your old journal**, on the welcome screen or in
  Settings, to move your old journal into your Arcnode account.
- Password sessions from 2.0.0 and 2.0.1 no longer work, and the app deletes a saved one when it
  starts. If you were signed in with your 1.x password, sign in with Arcnode.
- ArcJournal uses the normal window frame of your system: minimize, maximize and close on the
  right on Windows, the usual buttons on macOS and Linux. The custom title bar is gone.
- Pages use the width of a large window: Today, Stats, Settings, Account Standing and the admin
  panel are wider, Settings shows two columns, and small text is larger and easier to read.

### Fixed

- Errors from the app no longer start with "Error invoking remote method", and cancelling
  sign-in shows a short note instead of an error.

### Removed

- Password sign-in (`POST /auth/login` now answers `410` with `arcnode_only`; 1.x apps still get
  `426` and the download link) and `POST /user/link-arcnode`.

## 2.0.1

### Fixed

- ArcJournal 1.x apps now show "This version is no longer supported, download the latest version"
  instead of "Sign in failed" or "Your session expired".
- Deleting an entry also deletes its server-side safety copy, and a rejected migration no longer
  leaves one behind.
- Editing a 1.x entry before it was migrated keeps its saved versions.

### Security

- macOS and Linux updates are installed only when the release's checksums carry a valid
  signature from the ArcJournal release key built into the app, and each download is checked
  again right before it is installed.
- Electron fuses: no running as plain Node, no NODE_OPTIONS or inspect flags, and the app only
  loads from its own integrity-checked archive.
- Exact origin checks for navigation and IPC, a redirect guard and a permission check handler.
- Without an OS keychain, the sign-in token is kept in memory instead of written to disk.
- Sign-in checks that the response came from Arcnode, password sign-in takes the same time
  whether or not an account exists, and the editor no longer uses `innerHTML` to read entries.
- Updated editor dependencies, including a fix for a paste XSS in ProseMirror.

### Changed

- The packages no longer include a MongoDB binary used only by the tests, so they are smaller.
- The docs say plainly that 1.x entries keep a plaintext safety copy on the server for 90 days
  after they are encrypted, that macOS 13 is the minimum, and that the Windows installer is not
  code-signed.

## 2.0.0

A rebuild of ArcJournal around privacy and a proper desktop app.

### New

- **End-to-end encryption.** Entries, versions and attachments are encrypted on your computer
  with AES-256-GCM. Choose a passphrase and save a recovery key; the server stores what you write
  in 2.0 only as ciphertext. 1.x entries stay plaintext until you open them in 2.0, and the server
  keeps a plaintext safety copy of each for 90 days after it is encrypted.
- **Sign in with your Arcnode account**, in your browser, with passkeys and two-factor
  authentication. New accounts are made on arcnode.dev.
- **Your 1.x account keeps working**: sign in with your password and connect an Arcnode
  account when you are ready. The password stops working once you have connected.
- **Your 1.x journal is encrypted safely**: a full backup is saved on your computer first,
  every entry is checked after encrypting, and an interrupted migration picks up where it
  stopped.
- **macOS and Linux.** A universal macOS app (macOS 13 or later, Apple silicon and Intel) and `.deb`, `.rpm` and
  `.zip` packages for Linux, next to the Windows installer.
- **Automatic updates on every platform.** New versions download in the background and are
  checked against the release's checksums; restart to update. Linux packages install through
  the system password prompt.
- Keep the journal unlocked on a computer you trust, using the system keychain.
- Lock your journal from the sidebar; change your passphrase or recovery key in Settings.
- A proper macOS menu with copy, paste and zoom, and the native window buttons.
- The window remembers its size and position.

### Changed

- Stats are computed on your computer.
- The current streak no longer resets in the morning before you wrote today's entry.
- Fonts are part of the app instead of loaded from Google.
- Electron 45, Express 5, Vite 7.

### Security

- Suspended and terminated accounts can no longer use the journal API.
- A strict content security policy, a sandboxed interface without Node.js access, and an
  `app://` origin instead of `file://`.
- Development scripts that pointed at `localhost` are no longer in the released app.
- Admin search input is escaped, and the API is rate limited.
- Admins see account activity, never what you wrote.

### Removed

- Creating new accounts with an ArcJournal password, and signing in from 1.x apps.
- Unused AI helpers.

## 1.1.1

- Shows the app version in Settings.

## 1.1.0

- Admin panel, moderation, warnings and account standing.
