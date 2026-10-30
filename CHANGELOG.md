# Changelog

## 2.0.0

A rebuild of ArcJournal around privacy and a proper desktop app.

### New

- **End-to-end encryption.** Entries, versions and attachments are encrypted on your computer
  with AES-256-GCM. Choose a passphrase and save a recovery key; the server only stores
  ciphertext.
- **Sign in with your Arcnode account**, in your browser, with passkeys and two-factor
  authentication. New accounts are made on arcnode.dev.
- **Your 1.x account keeps working**: sign in with your password and connect an Arcnode
  account when you are ready. The password stops working once you have connected.
- **Your 1.x journal is encrypted safely**: a full backup is saved on your computer first,
  every entry is checked after encrypting, and an interrupted migration picks up where it
  stopped.
- **macOS and Linux.** A universal macOS app (Apple silicon and Intel) and `.deb`, `.rpm` and
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
