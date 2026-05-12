#!/usr/bin/env node
/**
 * Generate PNG icons from SVG logo using sharp.
 * Run: node scripts/gen-logos.mjs
 * Requires: pnpm add -D sharp
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('sharp not installed. Run: pnpm add -D sharp');
    process.exit(1);
  }

  const svgPath = join(ROOT, 'assets', 'logo.svg');
  const svg = readFileSync(svgPath);

  const sizes = [
    { name: 'assets/logo-192.png', size: 192 },
    { name: 'assets/logo-512.png', size: 512 },
    { name: 'ui/icons/icon-192.png', size: 192 },
    { name: 'ui/icons/icon-512.png', size: 512 },
  ];

  for (const { name, size } of sizes) {
    const outPath = join(ROOT, name);
    const outDir = dirname(outPath);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    await sharp(svg).resize(size, size).png().toFile(outPath);
    console.log(`  Generated ${name} (${size}x${size})`);
  }

  // Maskable icon: add safe-area padding (10% each side)
  const maskableSize = 512;
  const innerSize = Math.round(maskableSize * 0.8);
  const offset = Math.round(maskableSize * 0.1);
  const inner = await sharp(svg).resize(innerSize, innerSize).png().toBuffer();
  const maskable = await sharp({
    create: { width: maskableSize, height: maskableSize, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } }
  }).composite([{ input: inner, top: offset, left: offset }]).png().toFile(join(ROOT, 'assets', 'logo-512-maskable.png'));
  console.log('  Generated assets/logo-512-maskable.png (512x512 maskable)');

  // OG image 1200x630
  const ogWidth = 1200;
  const ogHeight = 630;
  const logoForOg = await sharp(svg).resize(280, 280).png().toBuffer();
  await sharp({
    create: { width: ogWidth, height: ogHeight, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } }
  }).composite([
    { input: logoForOg, top: 100, left: Math.round((ogWidth - 280) / 2) },
  ]).png().toFile(join(ROOT, 'assets', 'og-image.png'));
  console.log('  Generated assets/og-image.png (1200x630)');

  console.log('\nDone! Remember to commit the generated PNGs.');
}

main().catch(console.error);
