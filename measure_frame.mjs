import fs from 'fs';
import { PNG } from 'pngjs';

const buffer = fs.readFileSync('public/frames/black-device.png');
const png = PNG.sync.read(buffer);

let minX = png.width, minY = png.height, maxX = 0, maxY = 0;
let transparentPixels = 0;

for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
        const idx = (png.width * y + x) << 2;
        const alpha = png.data[idx + 3];
        
        // If pixel is fully transparent, it might be the screen
        // Note: The corners outside the phone are also transparent!
        // We only care about the large transparent block in the middle.
        if (alpha === 0) {
            transparentPixels++;
        }
    }
}

console.log(`Image size: ${png.width}x${png.height}`);
console.log(`Total transparent pixels: ${transparentPixels}`);

// Find the screen by looking for the first transparent pixel in the center horizontal line
const centerY = Math.floor(png.height / 2);
let screenMinX = -1, screenMaxX = -1;
for (let x = 0; x < png.width; x++) {
    const idx = (png.width * centerY + x) << 2;
    if (png.data[idx + 3] === 0) {
        if (screenMinX === -1) screenMinX = x;
        screenMaxX = x;
    }
}

const centerX = Math.floor(png.width / 2);
let screenMinY = -1, screenMaxY = -1;
for (let y = 0; y < png.height; y++) {
    const idx = (png.width * y + centerX) << 2;
    if (png.data[idx + 3] === 0) {
        if (screenMinY === -1) screenMinY = y;
        screenMaxY = y;
    }
}

console.log(`Screen X: ${screenMinX} to ${screenMaxX} (width: ${screenMaxX - screenMinX + 1})`);
console.log(`Screen Y: ${screenMinY} to ${screenMaxY} (height: ${screenMaxY - screenMinY + 1})`);
