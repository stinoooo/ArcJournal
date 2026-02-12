# ArcJournal — Deployment & Updates

A complete guide to hosting the backend on Railway and shipping
auto-updates to users via GitHub Releases.

---

## Part 1 — Host the Backend on Railway

### Why Railway?
Your Electron app needs somewhere to run `server/index.js` and MongoDB
that isn't your own laptop. Railway gives you a free tier that's
enough for personal use, and a $5/month hobby plan for heavier use.

### 1.1 — Push your code to GitHub

```bash
# From the ArcJournal root folder
git init
git add .
git commit -m "Initial commit"

# Create a repo at github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/arcjournal.git
git push -u origin main
```

Add a `.gitignore` if you haven't already — it should exclude:
```
.env
node_modules/
client/dist/
out/
```

---

### 1.2 — Create a Railway project

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project → Deploy from GitHub repo**.
3. Select your `arcjournal` repository.
4. Railway will auto-detect the `railway.json` and start deploying.

---

### 1.3 — Add a MongoDB database

In your Railway project dashboard:

1. Click **+ New** → **Database** → **MongoDB**.
2. Railway provisions a MongoDB instance and injects `MONGO_URL`
   into your environment automatically.
3. In your service's **Variables** tab, set:

| Variable | Value |
|---|---|
| `MONGODB_URI` | `${{MongoDB.MONGO_URL}}` (Railway reference syntax) |
| `JWT_SECRET` | A long random string (use a password manager) |
| `JWT_EXPIRES_IN` | `30d` |
| `PORT` | `3001` |

Railway will give you a public URL like:
`https://arcjournal-server-production.up.railway.app`

---

### 1.4 — Point the Electron app at Railway

Create `client/.env.production` (this file is used when you run `npm run build`):

```env
VITE_API_URL=https://arcjournal-server-production.up.railway.app
```

Now when you build the Electron app (`npm run make`), it will talk
to your Railway server instead of localhost.

---

### 1.5 — Redeploy after code changes

Because Railway is connected to your GitHub repo, every `git push`
to the `main` branch automatically triggers a redeploy. You don't
need to do anything else — it's fully automatic.

---

## Part 2 — Ship Auto-Updates via GitHub Releases

When you push a new `.exe` to GitHub Releases, your users will see
the in-app update banner automatically on next launch.

### 2.1 — Create a GitHub Personal Access Token

1. Go to **github.com → Settings → Developer settings →
   Personal access tokens → Fine-grained tokens**.
2. Create a token with **repo** scope (read & write).
3. Copy the token — you'll need it once.

---

### 2.2 — Set the token in your environment

On Windows (one-time, run in your terminal):
```powershell
$env:GITHUB_TOKEN = "ghp_yourTokenHere"
```

Or add it permanently via **System Properties → Environment Variables**.

---

### 2.3 — Update `package.json` with your GitHub username

In `package.json`, find the `publishers` section and replace
`YOUR_GITHUB_USERNAME` with your actual GitHub username:

```json
"repository": {
  "owner": "stinoooo",
  "name": "arcjournal"
}
```

---

### 2.4 — Bump the version

In `package.json`, increment the version before each release:

```json
"version": "1.1.0"
```

Also update it in the `packagerConfig`:
```json
"appVersion": "1.1.0"
```

---

### 2.5 — Build and publish

```bash
npm run publish
```

This will:
1. Build the React frontend (`client/dist/`)
2. Package the Electron app into an installer (`.exe` on Windows)
3. Create a **draft release** on GitHub with the installer attached
4. Upload a `RELEASES` file that `electron-updater` reads

Then go to **github.com → your repo → Releases** and click
**Publish** on the draft release to make it live.

Existing users will see the update banner in-app within ~5 seconds
of next launch.

---

## Summary: Your Workflow Going Forward

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  SERVER CHANGES (API, database, routes)                     │
│  ─────────────────────────────────────                      │
│  1. Make your changes                                       │
│  2. git add . && git commit -m "fix: ..."                   │
│  3. git push                                                │
│  → Railway redeploys automatically in ~1 minute             │
│                                                             │
│  CLIENT CHANGES (new features for users)                    │
│  ────────────────────────────────────────                   │
│  1. Make your changes                                       │
│  2. Bump version in package.json                            │
│  3. npm run publish                                         │
│  4. Go to GitHub → Releases → Publish the draft            │
│  → Users see update banner on next app launch               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

**Railway deploy fails:**
Check the build logs in the Railway dashboard. Most common issue is
a missing env variable — make sure `MONGODB_URI` and `JWT_SECRET` are set.

**Auto-update not triggering:**
- Confirm the GitHub release is published (not a draft).
- The update check only runs in production builds, not in `npm start`.
- Make sure the new version number is higher than the installed one.

**CORS errors in production:**
Add your Railway URL to the `CORS_ORIGINS` env var in Railway:
```
CORS_ORIGINS=https://arcjournal-server-production.up.railway.app
```

