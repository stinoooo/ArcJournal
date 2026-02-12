# ArcJournal

> Your personal daily reflection app — Part of the **ArcNode Network**

ArcJournal is a production-quality desktop journaling application built with **ElectronJS**, **React**, **Express**, and **MongoDB**. It features daily journal entries, a beautiful calendar view, AI-powered weekly summaries (ArcWrapped), secure auth, and a sleek futuristic UI.

---

## ✦ Features

- **Sign Up / Sign In** — JWT auth with bcrypt, secure token stored via Electron's `safeStorage`
- **Daily Journaling** — One entry per day with title, content, grade (1-10), and emoji mood
- **Calendar View** — Navigate past entries by month with visual grade/emoji indicators
- **Search** — Full-text search across all entries
- **Edit & Delete** — Update or remove any entry with confirmation modals
- **ArcWrapped** — Weekly AI-powered summaries via Gemini: trends, highlights, recap, mood frequency
- **Settings** — Update profile, delete all entries, or delete account (with cascade)
- **Custom Title Bar** — Electron frameless window with minimize/maximize/close

---

## 📁 Project Structure

```
arcjournal/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # contextBridge (secure IPC)
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── api/         # Axios API client
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # AuthContext, ToastContext
│   │   ├── pages/       # SignIn, SignUp, Dashboard, Journal, ArcWrapped, Settings
│   │   └── styles/      # Global CSS (ArcNode palette)
│   ├── index.html
│   └── vite.config.js
├── server/              # Express API
│   ├── routes/          # auth, entries, wraps, user
│   ├── models/          # User, Entry, Wrap (Mongoose)
│   ├── middleware/       # JWT auth middleware
│   ├── helpers/         # Gemini AI helper
│   └── index.js
├── assets/
│   └── bluelogo.png     # ArcNode logo
├── .env.example
└── package.json         # Root (Electron + orchestration)
```

---

## ⚡ Quick Start

### 1. Prerequisites

- **Node.js** v18+ and npm
- **MongoDB** running locally or a MongoDB Atlas URI
- **Gemini API key** (for ArcWrapped — get one free at aistudio.google.com)

### 2. Clone & Install

```bash
git clone <repo-url>
cd arcjournal

# Install root deps (Electron + tooling)
npm install

# Install server deps
cd server && npm install && cd ..

# Install client deps
cd client && npm install && cd ..
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:

```
MONGODB_URI=mongodb://localhost:27017/arcjournal
JWT_SECRET=your_super_secret_jwt_key_here
GEMINI_API_KEY=AIza...
```

> The `.env` file lives at the **project root**. The server loads it with `dotenv` at startup.

### 4. Add Logo & Emotion Assets

**Logo** — place in both locations:

```bash
cp /your/bluelogo.png assets/bluelogo.png
cp /your/bluelogo.png client/public/bluelogo.png
```

**Emotion PNGs** — ArcJournal uses 8 named emotion images instead of unicode emoji:

```
assets/emotions/
  angry.png
  confident.png
  embarrassed.png
  happy.png
  loved.png
  playful.png
  sad.png
  scared.png
```

Copy them to Vite's public folder so they're served in dev:

```bash
cp assets/emotions/*.png client/public/emotions/
```

> Recommended size: **128×128px** with transparent background.
> The app gracefully falls back to text emoji if a PNG is missing (via `onError` handler).

The `setup.sh` script handles all this copying automatically.

---

## 🚀 Run in Development

Open **3 terminals** (or use the single command below):

```bash
# Terminal 1 — Start MongoDB (if local)
mongod

# Terminal 2 — Start Express server
cd server && npm run dev

# Terminal 3 — Start Vite dev server + Electron
npm start
```

**Or use the single orchestrated command** (requires `concurrently` + `wait-on`, already installed):

```bash
npm start
```

This starts:
- Express API on `http://localhost:3001`
- Vite dev server on `http://localhost:5173`
- Electron (waits for Vite to be ready, then launches)

---

## 🏗️ Build Production Executable

### Step 1: Build the React client

```bash
npm run build
```

This outputs to `client/dist/`.

### Step 2: Package with Electron Forge

```bash
npm run make
```

This produces installers in `out/make/`:
- **Windows**: `.exe` (Squirrel installer)
- **macOS**: `.dmg` (zip)
- **Linux**: `.deb`

> Electron Forge is already configured in `package.json` under the `"config"` key.

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Sign in |
| GET | `/auth/me` | Get current user |
| POST | `/entries` | Create/upsert entry |
| GET | `/entries` | List entries (with `from`, `to`, `search` params) |
| GET | `/entries/:date` | Get entry by date (YYYY-MM-DD) |
| PUT | `/entries/:id` | Update entry |
| DELETE | `/entries/:id` | Delete entry |
| POST | `/wraps/generate?weekStart=` | Generate ArcWrapped |
| GET | `/wraps` | List all wraps |
| GET | `/wraps/:id` | Get wrap detail |
| DELETE | `/user` | Delete account + cascade |
| DELETE | `/user/entries` | Delete all entries |
| GET | `/user/profile` | Get profile |
| PUT | `/user/profile` | Update profile |

---

## 🎨 Design System

| Variable | Value | Usage |
|----------|-------|-------|
| `--bg` | `#0B1020` | App background |
| `--surface` | `#111A33` | Cards, inputs |
| `--text` | `#E8ECF5` | Primary text |
| `--muted` | `#9AA6C2` | Secondary text |
| `--accent` | `#6AE4FF` | Primary accent, glow |
| `--error` | `#FF5C7A` | Errors, danger |
| `--success` | `#3DFFB5` | Success states |

Fonts: **Syne** (display/headings) + **DM Sans** (body)

---

## 🔐 Security Notes

- JWT tokens are stored via Electron's `safeStorage` (OS-level encryption) — never in `localStorage`
- All API routes (except signup/login) require valid JWT
- Entries and wraps are scoped by `userId` — no cross-user access
- Passwords hashed with bcrypt (12 rounds)
- Secrets live only in `.env` (never hardcoded)

---

## 📝 License

Part of the **ArcNode Network**. All rights reserved.
