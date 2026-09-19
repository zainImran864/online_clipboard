const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function createIcoFromPng(pngBuffer) {
    // 6-byte ICONDIR
    const iconDir = Buffer.alloc(6);
    iconDir.writeUInt16LE(0, 0); // Reserved
    iconDir.writeUInt16LE(1, 2); // Type 1 = Icon
    iconDir.writeUInt16LE(1, 4); // Number of images

    // 16-byte ICONDIRENTRY
    const iconEntry = Buffer.alloc(16);
    iconEntry.writeUInt8(0, 0); // Width 256 (0 means 256)
    iconEntry.writeUInt8(0, 1); // Height 256 (0 means 256)
    iconEntry.writeUInt8(0, 2); // Colors (0 = no palette)
    iconEntry.writeUInt8(0, 3); // Reserved
    iconEntry.writeUInt16LE(1, 4); // Color planes
    iconEntry.writeUInt16LE(32, 6); // Bits per pixel
    iconEntry.writeUInt32LE(pngBuffer.length, 8); // Size of image data in bytes
    iconEntry.writeUInt32LE(22, 12); // Offset of image data (6 + 16 = 22)

    return Buffer.concat([iconDir, iconEntry, pngBuffer]);
}

async function main() {
    const rootDir = path.resolve(__dirname, '..');
    const svgPath = path.join(rootDir, 'app', 'icon.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf8');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body, html { width: 100%; height: 100%; overflow: hidden; background: transparent; display: flex; align-items: center; justify-content: center; }
          svg { width: 100%; height: 100%; display: block; }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
    `;

    console.log('Launching headless browser to render SVG icons...');
    const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ headless: true }));
    const page = await browser.newPage();

    // 512x512 PNG
    await page.setViewportSize({ width: 512, height: 512 });
    await page.setContent(htmlContent);
    const png512 = await page.screenshot({ omitBackground: true });

    // 256x256 PNG for ICO
    await page.setViewportSize({ width: 256, height: 256 });
    await page.setContent(htmlContent);
    const png256 = await page.screenshot({ omitBackground: true });

    // 192x192 PNG for PWA
    await page.setViewportSize({ width: 192, height: 192 });
    await page.setContent(htmlContent);
    const png192 = await page.screenshot({ omitBackground: true });

    await browser.close();

    // Write PNG files
    const assetsDir = path.join(rootDir, 'desktop', 'assets');
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    fs.writeFileSync(path.join(assetsDir, 'icon.png'), png512);
    fs.writeFileSync(path.join(rootDir, 'public', 'icon-512.png'), png512);
    fs.writeFileSync(path.join(rootDir, 'public', 'icon-192.png'), png192);

    // Create ICO files
    const ico256 = createIcoFromPng(png256);
    fs.writeFileSync(path.join(assetsDir, 'icon.ico'), ico256);
    fs.writeFileSync(path.join(rootDir, 'app', 'favicon.ico'), ico256);

    console.log('✅ Successfully generated authentic Pasteport icons:');
    console.log('  - desktop/assets/icon.png (512x512)');
    console.log('  - desktop/assets/icon.ico (256x256 Windows Icon)');
    console.log('  - app/favicon.ico (256x256 Favicon)');
    console.log('  - public/icon-512.png (512x512 PWA)');
    console.log('  - public/icon-192.png (192x192 PWA)');
}

main().catch((err) => {
    console.error('Error generating icons:', err);
    process.exit(1);
});
