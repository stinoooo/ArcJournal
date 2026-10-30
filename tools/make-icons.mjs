// Builds every app icon from assets/icon.png (square, at least 1024 px).
// Writes assets/icons/icon.ico (Windows), icon.icns (macOS) and PNGs for Linux.
// Run with: npm run icons
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import png2icons from 'png2icons';

const source = new URL('../assets/icon.png', import.meta.url);
const out = new URL('../assets/icons/', import.meta.url);

await mkdir(out, { recursive: true });
const input = await readFile(source);
const master = await sharp(input).resize(1024, 1024).png().toBuffer();

const ico = png2icons.createICO(master, png2icons.BICUBIC2, 0, false, true);
const icns = png2icons.createICNS(master, png2icons.BICUBIC2, 0);
if (!ico || !icns) throw new Error('Icon conversion failed');
await writeFile(new URL('icon.ico', out), ico);
await writeFile(new URL('icon.icns', out), icns);

for (const size of [16, 32, 48, 64, 128, 256, 512, 1024]) {
  await sharp(master).resize(size, size).png({ compressionLevel: 9 }).toFile(new URL(`${size}x${size}.png`, out).pathname.replace(/^\/([A-Z]:)/, '$1'));
}
await writeFile(new URL('icon.png', out), await sharp(master).resize(512, 512).png({ compressionLevel: 9 }).toBuffer());
console.log('Icons written to assets/icons/');
