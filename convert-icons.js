/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node build script, run via `node convert-icons.js` */
// Generates the PWA PNG icons (public/icon-192.png, public/icon-512.png)
// from the Pasteport mark. Uses a full-bleed square background (no rounded
// corners) so the icons work as "maskable" — the OS applies its own mask.
//
// Run: node convert-icons.js
const sharp = require('sharp');
const path = require('path');

// Maskable source: solid theme-color square + white "P" monogram + paper plane.
// The mark stays well within the maskable safe zone (centered ~80%).
const svg = `<svg width="512" height="512" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" fill="#2563EB"/>
  <path d="M23 48V18h13a9 9 0 0 1 0 18h-9" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M45 21l-12 4 4.5 2 1.5 4.5z" fill="#ffffff"/>
</svg>`;

async function generate() {
  const publicDir = path.join(__dirname, 'public');
  const buffer = Buffer.from(svg);

  for (const size of [192, 512]) {
    const out = path.join(publicDir, `icon-${size}.png`);
    await sharp(buffer).resize(size, size).png().toFile(out);
    console.log(`✓ wrote public/icon-${size}.png`);
  }
}

generate().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
