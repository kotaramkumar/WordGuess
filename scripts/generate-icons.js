const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, '..', 'assets');

// WordGuess brand colors
const BG = '#121213';
const GREEN = '#538d4e';
const YELLOW = '#b59f3b';
const GREY = '#3a3a3c';
const WHITE = '#ffffff';

/**
 * Build the main icon SVG.
 * size: total canvas size (1024 for iOS/store icon, 512 for Android foreground)
 * transparent: whether background should be transparent (Android foreground)
 * monochrome: render tiles in single white color (Android monochrome)
 */
function buildIconSVG(size, { transparent = false, monochrome = false } = {}) {
  const pad = size * 0.10;          // 10% padding
  const gap = size * 0.028;          // gap between tiles
  const tileSize = (size - pad * 2 - gap) / 2;
  const r = tileSize * 0.09;         // border radius
  const fontSize = tileSize * 0.55;
  const x1 = pad;
  const x2 = pad + tileSize + gap;
  const y1 = pad + size * 0.04;      // shift grid slightly upward from center
  const y2 = y1 + tileSize + gap;

  // Tile colors per position [top-left, top-right, bottom-left, bottom-right]
  const colors = monochrome
    ? [WHITE, WHITE, WHITE, WHITE]
    : [GREEN, YELLOW, GREY, GREEN];

  const bgRect = transparent
    ? ''
    : `<rect width="${size}" height="${size}" fill="${BG}"/>`;

  // Small "WORD GUESS" label below tiles
  const labelY = y2 + tileSize + size * 0.045;
  const labelSize = size * 0.055;
  const labelColor = monochrome ? WHITE : '#818384';
  const label = monochrome ? '' : `
    <text x="${size / 2}" y="${labelY}"
      font-family="Arial Black,Helvetica Neue,Arial,sans-serif"
      font-weight="900" font-size="${labelSize}"
      fill="${labelColor}" text-anchor="middle"
      letter-spacing="${size * 0.012}">WORD GUESS</text>`;

  function tile(x, y, letter, color) {
    return `
      <rect x="${x}" y="${y}" width="${tileSize}" height="${tileSize}"
        fill="${color}" rx="${r}" ry="${r}"/>
      <text x="${x + tileSize / 2}" y="${y + tileSize / 2}"
        font-family="Arial Black,Helvetica Neue,Arial,sans-serif"
        font-weight="900" font-size="${fontSize}" fill="${WHITE}"
        text-anchor="middle" dominant-baseline="central">${letter}</text>`;
  }

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  ${bgRect}
  ${tile(x1, y1, 'W', colors[0])}
  ${tile(x2, y1, 'G', colors[1])}
  ${tile(x1, y2, 'R', colors[2])}
  ${tile(x2, y2, 'D', colors[3])}
  ${label}
</svg>`;
}

async function generatePNG(svgString, outputPath, width, height, removeAlpha = false) {
  let pipeline = sharp(Buffer.from(svgString)).resize(width, height);
  if (removeAlpha) pipeline = pipeline.flatten({ background: BG }).toColorspace('srgb');
  await pipeline.png().toFile(outputPath);
  console.log('✓', path.basename(outputPath), `${width}x${height}`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // iOS / store icon — 1024x1024 RGB, no alpha
  await generatePNG(
    buildIconSVG(1024),
    path.join(OUT, 'icon.png'),
    1024, 1024,
    true   // flatten alpha → RGB required by Apple
  );

  // Splash screen — tiles only, no label, dark bg, centered with breathing room
  const splashSVG = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="${BG}"/>
    <rect x="212" y="272" width="260" height="260" fill="${GREEN}" rx="22"/>
    <text x="342" y="402" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="145" fill="${WHITE}" text-anchor="middle" dominant-baseline="central">W</text>
    <rect x="552" y="272" width="260" height="260" fill="${YELLOW}" rx="22"/>
    <text x="682" y="402" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="145" fill="${WHITE}" text-anchor="middle" dominant-baseline="central">G</text>
    <rect x="212" y="552" width="260" height="260" fill="${GREY}" rx="22"/>
    <text x="342" y="682" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="145" fill="${WHITE}" text-anchor="middle" dominant-baseline="central">R</text>
    <rect x="552" y="552" width="260" height="260" fill="${GREEN}" rx="22"/>
    <text x="682" y="682" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="145" fill="${WHITE}" text-anchor="middle" dominant-baseline="central">D</text>
  </svg>`;
  await generatePNG(splashSVG, path.join(OUT, 'splash-icon.png'), 1024, 1024);

  // Android adaptive foreground — 1024x1024 RGBA, transparent bg, safe-zone ~66%
  await generatePNG(
    buildIconSVG(1024, { transparent: true }),
    path.join(OUT, 'android-icon-foreground.png'),
    1024, 1024
  );

  // Android adaptive background — solid brand color
  const bgSVG = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="${BG}"/>
  </svg>`;
  await generatePNG(bgSVG, path.join(OUT, 'android-icon-background.png'), 1024, 1024);

  // Android monochrome — white-on-transparent
  await generatePNG(
    buildIconSVG(1024, { transparent: true, monochrome: true }),
    path.join(OUT, 'android-icon-monochrome.png'),
    1024, 1024
  );

  // Favicon — 48x48
  await generatePNG(
    buildIconSVG(48),
    path.join(OUT, 'favicon.png'),
    48, 48,
    true
  );

  console.log('\nAll icons generated successfully.');
}

main().catch(err => { console.error(err); process.exit(1); });
