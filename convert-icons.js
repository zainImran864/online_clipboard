const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertIcons() {
  const publicDir = path.join(__dirname, 'public');
  
  // Read the SVG content
  const svg192 = fs.readFileSync(path.join(publicDir, 'icon-192.png'), 'utf-8');
  const svg512 = fs.readFileSync(path.join(publicDir, 'icon-512.png'), 'utf-8');
  
  try {
    // Convert 192x192
    await sharp(Buffer.from(svg192))
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192-converted.png'));
    
    console.log('✓ Created icon-192-converted.png');
    
    // Convert 512x512
    await sharp(Buffer.from(svg512))
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512-converted.png'));
    
    console.log('✓ Created icon-512-converted.png');
    
    console.log('\nNow replace the original files:');
    console.log('mv public/icon-192-converted.png public/icon-192.png');
    console.log('mv public/icon-512-converted.png public/icon-512.png');
    
  } catch (error) {
    console.error('Error converting icons:', error);
  }
}

convertIcons();
