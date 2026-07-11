# Pasteport — Online Clipboard

Share files, text, PDFs, and images instantly with a simple 6‑digit code. **No login required.** Content is available for 24 hours, then automatically deleted.

Built with Next.js (App Router), Firebase Firestore, and Cloudflare R2. Installable as a PWA.

> **Live demo:** https://online-clipboard-beta.vercel.app

---

## Table of contents

- [Features](#features)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Routes](#routes)
  - [Pages](#pages)
  - [API endpoints](#api-endpoints)
- [Environment variables](#environment-variables)
- [Getting started](#getting-started)
- [Firestore data model](#firestore-data-model)
- [Storage tiers & limits](#storage-tiers--limits)
- [Deployment](#deployment)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- 📋 **Share text and/or files** — send plain text, code, PDFs, images, Office docs, archives, or any combination.
- 🔢 **6‑digit share codes** — recipients open content by code or by pasting the share link.
- 🔴 **Real‑time updates** — the recipient can enable "live mode" to see the sender's edits as they type (powered by Firestore snapshots).
- ⏳ **Auto‑expiry** — every clip expires 24 hours after creation and is cleaned up (including its R2 objects) by a daily cron.
- 🗂️ **Smart storage** — small payloads live inline in Firestore; large files and large text are offloaded to Cloudflare R2.
- 🛡️ **Per‑file size limit** — up to 10 MB per file, enforced client‑side and server‑side. No daily/total quota.
- 📱 **PWA** — installable on mobile/desktop with offline‑ready service worker and app manifest.
- 🔓 **No accounts** — nothing to sign up for; no personal data collected.

## How it works

1. **Send** — On `/send`, the user types text and/or selects files, then clicks *Generate Share Code*.
   - Files are uploaded through `POST /api/files/upload`, which enforces type and per‑file size (10 MB) validation, then stores each file either inline (base64 in Firestore) or in R2 depending on size.
   - A `clips` document is created in Firestore with a unique 6‑digit `code` and a 24‑hour `expiresAt`.
   - Text larger than ~900 KB is offloaded to R2 via `POST /api/text/upload` (Firestore documents are capped at ~1 MiB).
2. **Share** — The sender shares the 6‑digit code or the link `…/view/<code>`.
3. **Read** — On `/read` or `/view/<code>`, the recipient fetches the clip by code. Optionally they enable *live mode* to subscribe to real‑time updates.
4. **Expire** — A daily Vercel Cron hits `GET /api/cron/cleanup`, which deletes expired clip documents **and** their associated R2 objects (files and text).

## Tech stack

| Layer            | Technology                                            |
| ---------------- | ----------------------------------------------------- |
| Framework        | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Language         | TypeScript, React 19                                  |
| Styling          | Tailwind CSS v4                                        |
| Database         | Firebase Firestore (client SDK)                       |
| Object storage   | Cloudflare R2 (via the AWS S3 SDK)                    |
| Hosting / Cron   | Vercel                                                 |
| SEO / PWA        | `next-sitemap`, Web App Manifest + service worker     |

## Project structure

```
my-clipboard/
├── app/
│   ├── page.tsx                    # Home (splash + Send/Read cards)
│   ├── send/page.tsx               # Create a clip (text + files)
│   ├── read/page.tsx               # Open a clip by code or link
│   ├── view/[code]/page.tsx        # Open a clip directly via /view/<code>
│   ├── layout.tsx                  # Root layout, metadata, PWA tags
│   ├── globals.css                 # Tailwind + global styles
│   └── api/
│       ├── files/upload/route.ts   # POST — validate, store file (inline or R2)
│       ├── text/upload/route.ts    # POST — store oversized text in R2
│       └── cron/cleanup/route.ts   # GET  — delete expired clips + R2 objects
├── components/
│   ├── ContentViewer.tsx           # Renders text/file/both clips (code preview, images, docs)
│   ├── FileUpload.tsx              # Drag‑and‑drop file picker with validation
│   ├── CodeDisplay.tsx            # Shows the generated code + share link
│   ├── Logo.tsx, SplashScreen.tsx, PWAInstall.tsx
├── hooks/
│   └── useClipboard.ts             # create/read/update/subscribe clips; text↔R2 offload
├── lib/
│   ├── firebase.ts                 # Firebase app + Firestore init
│   ├── r2Storage.ts                # R2 upload/delete + key/URL helpers (S3 SDK)
│   ├── fileHandler.ts              # Client upload wrapper + file validation
│   └── codeGenerator.ts            # Unique 6‑digit code generation
├── public/                         # Icons, manifest, static assets
├── next.config.ts, vercel.json, next-sitemap.config.js
└── .env.example                    # Environment variable template
```

## Routes

### Pages

| Path           | Description                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| `/`            | Landing page with animated splash and *Send File* / *Read File* cards.      |
| `/send`        | Compose a clip: enter text, attach files, generate a code, edit in real time. |
| `/read`        | Enter a 6‑digit code **or** paste a share link to view content.             |
| `/view/[code]` | Direct deep link to a clip; the `[code]` segment is the 6‑digit code.       |

### API endpoints

All API routes run on the Node.js runtime.

#### `POST /api/files/upload`
Uploads a single file.
- **Body:** `multipart/form-data` with a `file` field.
- **Validation:** allowed MIME types / extensions (text, code, PDF, images, Office, zip/rar/tar/gz); max **10 MB** per file. There is no daily/total quota.
- **Storage:** files whose base64 payload is ≤ ~500 KB are returned as an inline `data:` URL (stored in Firestore); larger files are streamed to R2 and a public URL is returned.
- **Response:** `{ url, fileName, fileType, fileSize, storageProvider, storageKey? }`.

#### `POST /api/text/upload`
Stores oversized clip text in R2 (Firestore documents are capped at ~1 MiB; there is **no** size limit on text).
- **Body:** JSON `{ "text": "…" }`.
- **Response:** `{ url, storageKey, storageProvider: "r2" }`.

#### `GET /api/cron/cleanup`
Deletes all expired clips and their R2 objects (files **and** text). Intended to be called on a schedule.
- **Auth:** requires header `Authorization: Bearer <CRON_SECRET>`; returns `401` otherwise.
- **Behavior:** batches through documents where `expiresAt <= now`, deletes R2 objects first, then the Firestore document (so nothing is orphaned).
- **Response:** `{ checked, deletedClips, deletedR2Objects, r2DeleteErrors }`.
- **Schedule:** configured in [`vercel.json`](vercel.json) to run daily at `00:00 UTC`.

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local` and fill in your values.

### Firebase (client SDK) — required
Exposed to the browser via the `NEXT_PUBLIC_` prefix (expected for the Firebase web SDK; secure your data with Firestore Security Rules, not by hiding these).

| Variable                                | Description                          |
| --------------------------------------- | ------------------------------------ |
| `NEXT_PUBLIC_FIREBASE_API_KEY`          | Firebase web API key                 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`      | `your-project.firebaseapp.com`       |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`       | Firebase project ID                  |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`   | `your-project.firebasestorage.app`   |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging sender ID         |
| `NEXT_PUBLIC_FIREBASE_APP_ID`           | Firebase app ID                      |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`   | Analytics measurement ID *(optional)* |

### Cloudflare R2 (server‑side) — required for large files/text

| Variable                | Description                                                        |
| ----------------------- | ----------------------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID (used to build the R2 S3 endpoint)          |
| `R2_ACCESS_KEY_ID`      | R2 S3 API access key ID                                            |
| `R2_SECRET_ACCESS_KEY`  | R2 S3 API secret access key                                        |
| `R2_BUCKET_NAME`        | Target R2 bucket name                                              |
| `R2_PUBLIC_URL`         | Public bucket URL, e.g. `https://pub-xxxx.r2.dev` (no trailing `/`) |

### Security / operations

| Variable            | Required | Description                                                                                 |
| ------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `CRON_SECRET`       | Yes*     | Bearer token authorizing `/api/cron/cleanup`. *Required to run the cleanup cron.            |
| `QUOTA_HASH_SECRET` | No       | Secret for hashing the quota subject. Falls back to `CRON_SECRET`, then `R2_SECRET_ACCESS_KEY`. |

> **Note:** The public R2 bucket must allow browser `GET` (CORS) so large text/code files can be fetched and displayed client‑side.

## Getting started

### Prerequisites
- Node.js 18+ and npm
- A [Firebase](https://console.firebase.google.com) project with **Firestore** enabled
- A [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket with public access and an S3 API token

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/my-clipboard.git
cd my-clipboard
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# then edit .env.local with your Firebase + R2 values
```

### 3. Set up Firebase
1. Create a Firestore database.
2. Add Security Rules for the `clips` collection appropriate to your use case (this app reads/writes `clips` from the client).
3. *(Recommended)* Create a composite/single‑field index if prompted for the `expiresAt`/`code` queries.

### 4. Set up Cloudflare R2
1. Create a bucket and enable **public access** to obtain the `pub-….r2.dev` URL → `R2_PUBLIC_URL`.
2. Create an **S3 API token** (Access Key ID + Secret) → `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`.
3. Add a **CORS policy** allowing `GET` from your app's origin.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Firestore data model

Everything lives in a single **`clips`** collection, which stores two kinds of documents.

### Clip document

| Field                 | Type                     | Notes                                                        |
| --------------------- | ------------------------ | ------------------------------------------------------------ |
| `code`                | string                   | Unique 6‑digit share code                                    |
| `type`                | `'text' \| 'file' \| 'both'` | What the clip contains                                   |
| `content`             | string                   | Text (for `text`), or the first file's URL/data‑URL          |
| `textContent`         | string?                  | Text body for `both` clips                                   |
| `files`               | array?                   | `{ url, fileName, fileType, fileSize, storageProvider, storageKey? }` |
| `textStorageProvider` | `'r2'`?                  | Present when the text was offloaded to R2                    |
| `textStorageKey`      | string?                  | R2 object key for offloaded text                             |
| `fileName`,`fileType` | string?                  | Legacy fields (first file), kept for backward compatibility  |
| `createdAt`           | Timestamp                | Creation time                                                |
| `expiresAt`           | Timestamp                | Creation + 24h; used for expiry and cleanup                  |

## Storage tiers & limits

| Payload                     | Threshold            | Where it's stored                       |
| --------------------------- | -------------------- | --------------------------------------- |
| File (base64 ≤ ~500 KB)     | `INLINE_FIRESTORE_LIMIT` | Inline base64 `data:` URL in Firestore |
| File (larger), ≤ 10 MB      | —                    | Cloudflare R2                           |
| Text ≤ ~400 KB              | `TEXT_INLINE_LIMIT`  | Inline string in Firestore              |
| Text > ~400 KB              | —                    | Cloudflare R2                           |
| **Per file**                | **10 MB** max        | Rejected above the limit                |
| **Clip lifetime**           | **24 hours**         | Then deleted by the cron                |

There is **no** daily or total upload quota — only the 10 MB per‑file limit above. Text has no size limit (offloaded to R2 when large).

## Deployment

The app is designed for **Vercel**.

1. Import the repo into Vercel.
2. Add every variable from [`.env.example`](.env.example) under **Project → Settings → Environment Variables**.
3. Deploy. The daily cleanup cron is declared in [`vercel.json`](vercel.json):

   ```json
   { "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 0 * * *" }] }
   ```

   Vercel Cron automatically sends the `Authorization: Bearer <CRON_SECRET>` header when `CRON_SECRET` is set, matching what the endpoint expects.

Security headers (`X-Frame-Options`, `X-Content-Type-Options`, etc.) and PWA/service‑worker headers are configured in `vercel.json` and `next.config.ts`.

> **Firestore TTL note:** Do **not** enable Firestore native TTL on the `clips` collection. Native TTL would delete clip documents on its own schedule and bypass the cron, orphaning the associated R2 objects. Rely on the `/api/cron/cleanup` job, which deletes R2 objects *and* the document together.

### Progressive Web App (PWA)

Pasteport is installable and works offline for cached pages. The pieces:

- `public/manifest.json` — app metadata, icons, theme, and display mode.
- `public/sw.js` — service worker (registered by `components/PWAInstall.tsx`; disabled in dev for easier debugging).
- `public/icon-192.png`, `public/icon-512.png` — install icons.
- Service‑worker/manifest `Content-Type` and cache headers in `vercel.json` and `next.config.ts`.

**Requires HTTPS**, which Vercel provides automatically.

**Installing:**
- **Desktop (Chrome/Edge):** click the install icon in the address bar, or the install banner.
- **Android (Chrome):** menu (⋮) → *Install app* / *Add to Home Screen*.
- **iOS (Safari):** Share → *Add to Home Screen*.

**Verifying:** open Chrome DevTools → *Application* to confirm the Manifest loads and the Service Worker is active, then run a *Lighthouse* PWA audit.

**Troubleshooting:** if the app isn't installable or the install prompt doesn't appear, confirm you're on HTTPS, that `/manifest.json` and `/sw.js` are reachable, and try an incognito window (the prompt is suppressed once dismissed or if already installed). Hard‑reload/clear cache after changing the service worker.

## Scripts

| Command          | Description                                    |
| ---------------- | ---------------------------------------------- |
| `npm run dev`    | Start the dev server (Turbopack)               |
| `npm run build`  | Production build (runs `next-sitemap` after)   |
| `npm run start`  | Start the production server                    |
| `npm run lint`   | Run ESLint                                     |

## Contributing

Contributions are welcome! Please open an issue to discuss significant changes first, then submit a pull request. Keep changes focused and match the existing code style.

## License

Released under the [MIT License](LICENSE). See the `LICENSE` file for details.
