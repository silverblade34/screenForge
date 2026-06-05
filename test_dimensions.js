const scale = 1;
const screenW = 320 * scale;
const aspectRatio = 402 / 874;
const screenH = screenW / aspectRatio;

const assetScale = 1.248;
const frameW = screenW * assetScale;
const frameH = screenH * assetScale;

console.log({ screenW, screenH, frameW, frameH });
