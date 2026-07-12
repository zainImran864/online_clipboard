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
- [Supported file types](#supported-file-types)
- [Security](#security)
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
│   ├── secure/page.tsx             # Secret share — direct‑to‑R2 upload/download by code
│   ├── layout.tsx                  # Root layout, metadata, PWA tags
│   ├── globals.css                 # Tailwind + global styles
│   └── api/
│       ├── files/upload/route.ts       # POST — validate, store file (inline or R2)
│       ├── text/upload/route.ts        # POST — store oversized text in R2
│       ├── secure/authorize/route.ts   # POST — validate code, presign R2 upload
│       ├── secure/finalize/route.ts    # POST — burn code, create secure clip, return send code
│       ├── secure/download/route.ts    # POST — resolve send code to a presigned download URL
│       └── cron/cleanup/route.ts       # GET  — delete expired clips + R2 objects
├── components/
│   ├── ContentViewer.tsx           # Renders text/file/both clips (code preview, images, docs)
│   ├── FileUpload.tsx              # Drag‑and‑drop file picker with validation
│   ├── ShareCodeCard.tsx           # Reusable generated code + QR + share-link card
│   ├── CodeDisplay.tsx             # Legacy generated-code display component
│   ├── Logo.tsx, SplashScreen.tsx, PWAInstall.tsx
├── hooks/
│   └── useClipboard.ts             # create/read/update/subscribe clips; text↔R2 offload
├── lib/
│   ├── firebase.ts                 # Firebase app + Firestore init
│   ├── r2Storage.ts                # R2 upload/delete + key/URL helpers (S3 SDK)
│   ├── fileHandler.ts              # Client upload wrapper + file validation
│   ├── secureShare.ts              # Secret‑share client helpers + shared constants
│   └── codeGenerator.ts            # Unique 6‑/8‑digit code generation
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
| `/secure`      | Secret share: upload a large file directly to R2 with a one‑time access code, or download by send code. |

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

#### `POST /api/secure/authorize`
Step 1 of a secret‑share upload. Validates a one‑time access code and returns a **presigned POST** so the browser uploads the file straight to R2 (it never passes through the server, bypassing the serverless body limit). The code is *not* consumed here.
- **Body:** JSON `{ accessCode, fileName, fileType, fileSize }`.
- **Validation:** access code format + unused; `fileSize` ≤ `SECURE_MAX_FILE_SIZE`.
- **Response:** `{ uploadUrl, fields, storageKey }` for the direct R2 upload.

#### `POST /api/secure/finalize`
Step 2 of a secret‑share upload. Runs after the R2 upload lands: burns the one‑time access code, verifies the stored object, creates the secure clip document, and returns the **send code** used to download.
- **Body:** JSON `{ accessCode, storageKey, fileName, fileType }`.
- **Response:** `{ sendCode }`.

#### `POST /api/secure/download`
Resolves a send code to a short‑lived presigned download URL. Single request — there is deliberately no live/realtime path for secret shares, and expired shares (6h) are refused immediately.
- **Body:** JSON `{ sendCode }`.
- **Response:** `{ url, fileName, fileType, fileSize }`.

#### `GET /api/cron/cleanup`
Deletes all expired clips and their R2 objects (files **and** text). Intended to be called on a schedule.
- **Auth:** requires header `Authorization: Bearer <CRON_SECRET>`; returns `401` otherwise.
- **Behavior:** batches through documents where `expiresAt <= now`, deletes R2 objects first, then the Firestore document (so nothing is orphaned).
- **Response:** `{ checked, deletedClips, deletedR2Objects, r2DeleteErrors }`.
- **Schedule:** configured in [`vercel.json`](vercel.json) to run daily at `00:00 UTC`.

## Supported file types

Every file is capped at **10 MB**. The allow-list lives in one place — [`lib/allowedFiles.ts`](lib/allowedFiles.ts) — and is shared by the client validator, the upload API, and the file‑picker filter. A file is accepted by its **extension**, its **MIME type**, an exact **filename** (e.g. `Dockerfile`), any `.env*` dotfile, or when the browser reports **no MIME type** at all.

**Preview legend** — 📝 opens **inline** as read‑only escaped text · 🖼️ inline image · 🔊 inline audio player · 🎬 inline video player · ⬇️ download‑only.

> 🔒 **Nothing is ever executed.** Scripts (`.bat`, `.ps1`, `.sh`, …) and markup (`.html`, `.svg`) are shown as **escaped text** or rendered via `<img>`/`<video>` — the app has no code path that runs uploaded content. See the security note in [`lib/allowedFiles.ts`](lib/allowedFiles.ts).

| Category | Preview | Formats |
| -------- | :-----: | ------- |
| 🌐 **Web & markup** | 📝 | `.html` `.htm` `.md` `.css` `.vue` `.svelte` `.astro` `.ejs` `.hbs` `.handlebars` `.pug` `.jade` `.njk` `.liquid` `.scss` `.sass` `.less` `.styl` `.pcss` |
| 💻 **Programming languages** | 📝 | `.js` `.jsx` `.ts` `.tsx` `.mjs` `.cjs` `.py` `.sql` `.java` `.c` `.cpp` `.h` `.cs` `.php` `.rb` `.go` `.rs` `.swift` `.kt` `.dart` `.scala` `.r` `.lua` `.pl` `.pm` `.tcl` `.groovy` `.fs` `.fsx` `.f90` `.f95` `.asm` `.s` `.v` `.vh` `.sol` `.clj` `.cljs` `.ex` `.exs` `.erl` `.hrl` `.nim` `.zig` `.cr` `.ml` `.mli` `.cob` `.cobol` `.abap` `.m` `.mm` |
| 🖥️ **Shell & scripts** | 📝 *(never run)* | `.sh` `.bash` `.zsh` `.fish` `.ps1` `.bat` `.cmd` |
| ⚙️ **Config, data‑interchange & infra** | 📝 | `.json` `.json5` `.xml` `.yml` `.yaml` `.toml` `.ini` `.cfg` `.config` `.properties` `.env` `.conf` `.graphql` `.gql` `.tf` `.tfvars` `.hcl` `.nomad` `.kubeconfig` `.helm` `.gradle` `.lock` `.lockb` `.mod` `.sum` `.ansible` · dotfiles `.gitignore` `.gitattributes` `.gitmodules` `.dockerignore` `.editorconfig` `.eslintrc` `.prettierrc` `.stylelintrc` `.npmrc` `.yarnrc` `.babelrc` `.ignore` `.vagrantfile` |
| 🧰 **Project / build files** | 📝 | `.sln` `.csproj` `.vbproj` `.vcxproj` `.props` `.targets` `.http` `.rest` `.code-workspace` `.dockerfile` · filenames `Dockerfile` `Gemfile` `Pipfile` `Vagrantfile` `Makefile` `Procfile` `Rakefile` `Brewfile` `Jenkinsfile` |
| 📊 **Data & notebooks** | 📝 / ⬇️ | 📝 `.txt` `.csv` `.cvs` `.tsv` `.ndjson` `.geojson` `.ipynb` `.log` `.out` `.err` `.trace` · ⬇️ `.sqlite` `.sqlite3` `.db` `.db3` `.dump` `.bak` `.avro` `.parquet` `.feather` |
| 🖼️ **Images** | 🖼️ / ⬇️ | 🖼️ `.png` `.jpg` `.jpeg` `.gif` `.webp` `.svg` `.ico` `.bmp` `.tiff` `.avif` `.heic` `.heif` · ⬇️ `.raw` `.cr2` `.nef` |
| 🎨 **Design** | ⬇️ | `.psd` `.ai` `.xd` `.sketch` `.fig` `.figma` `.eps` `.indd` `.afdesign` |
| 🔤 **Fonts** | ⬇️ | `.ttf` `.otf` `.woff` `.woff2` `.eot` |
| 🔊 **Audio** | 🔊 | `.mp3` `.wav` `.ogg` `.oga` `.m4a` `.aac` `.flac` `.opus` `.weba` `.mid` `.midi` `.aiff` `.aif` `.amr` `.ac3` `.wma` |
| 🎬 **Video** | 🎬 | `.mp4` `.webm` `.ogv` `.mov` `.avi` `.mkv` `.mpeg` `.mpg` `.3gp` `.flv` `.wmv` `.m4v` `.mts` `.m2ts` `.vob` `.rm` `.rmvb` `.f4v` |
| 📄 **Documents** | ⬇️ | `.pdf` `.doc` `.docx` `.xls` `.xlsx` `.ppt` `.pptx` `.rtf` `.odt` `.ods` `.odp` `.pages` `.numbers` `.key` |
| 📚 **E‑books** | ⬇️ | `.epub` `.mobi` `.azw` `.azw3` `.fb2` |
| 🗜️ **Archives** | ⬇️ | `.zip` `.rar` `.tar` `.gz` `.tgz` `.7z` `.xz` `.bz2` |
| 📱 **Mobile & native** | 📝 / ⬇️ | 📝 `.storyboard` `.xib` · ⬇️ `.apk` `.aab` `.ipa` |
| 🎮 **Game engines** | 📝 / ⬇️ | 📝 `.gd` `.tscn` · ⬇️ `.unity` `.prefab` `.asset` |
| 🤖 **ML models** | ⬇️ | `.onnx` `.pb` `.ckpt` `.pt` `.pth` |
| 🔐 **Certificates & keys** | ⬇️ | `.pem` `.crt` `.csr` `.p12` `.pfx` |

> **Not allowed:** native desktop executables such as `.exe`, `.msi`, `.dll`, `.com`, `.scr`, `.vbs`, `.jar`, `.lnk`, and `.app` are intentionally excluded from the allow‑list.

## Security

### Uploaded files never execute in the browser

Potentially harmful files (scripts like `.bat`, `.ps1`, `.sh`; markup like `.html`, `.svg`) can be **shared**, but the app has **no code path that runs, `eval`s, or interprets uploaded content**. Every file is handled in exactly one of three safe ways:

- **Code / text / scripts / HTML → shown as escaped text.** Content is rendered inside `<pre><code>{text}</code></pre>`, where React escapes it. It is displayed as characters, never parsed as markup or code.
- **HTML is never injected into the DOM.** The app does **not** use `dangerouslySetInnerHTML`, `innerHTML`, `<iframe srcdoc>`, or any similar sink for uploaded content. An uploaded `.html` file is treated as plain text — its tags and `<script>`s are shown literally, not run.
- **Images / audio / video → rendered via `<img>` / `<video>` / `<audio>`.** SVGs load through `<img>`, where browsers **disable scripting**, so a malicious `<script>` inside an SVG cannot run.
- **Everything else → a download link.** No preview, no execution.

### Origin isolation

Even when a file is opened via its direct link, it can't reach the app:

- **Inline files** are `data:` URLs, which modern browsers treat as an **opaque origin** (and top‑level `data:` navigation is blocked in Chrome/Firefox) — no access to the app's cookies, storage, or DOM.
- **R2 files** are served from a **separate origin** (`pub‑…​.r2.dev`), so they are sandboxed from the app and from every other share by the same‑origin policy.

### What we can't control (your device)

Downloading a file just saves it to disk — nothing runs automatically. But if a recipient **deliberately** opens/executes a downloaded script or installer, that happens on **their** operating system, outside any web app's control (this is true of email, Drive, Dropbox, etc.). To reduce that risk, native desktop executables (`.exe`, `.msi`, `.dll`, `.com`, `.scr`, `.vbs`, `.jar`, `.lnk`, `.app`) are **not accepted** at all, and nothing is ever auto‑downloaded or auto‑run.

### Other protections

- **Auto‑expiry:** every share is deleted (document **and** R2 objects) 24 hours after creation by the cleanup cron.
- **No enumeration secrets in the client:** clips are addressed by random codes; the app never trusts a client‑supplied path.
- **Server‑enforced limits:** file type and the 10 MB per‑file cap are validated on the server, not just in the UI.

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
