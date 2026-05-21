import { getFFmpeg } from './ffmpeg';
import { ExportRenderer } from './ExportRenderer';
import { SceneScene, TextLayer } from '@/pages/device-animation/types';

const LOG = '[videoExporter]';

export interface ExportSettings {
  width: number;
  height: number;
  fps: number;
  duration: number;
  quality: 'Standard' | 'High' | 'Ultra';
  /** Kept for API compat, not used for rendering (DOM is captured directly). */
  scenes: SceneScene[];
  textLayers: TextLayer[];
  /** The live React canvas viewport DOM element to capture from. */
  canvasElement: HTMLElement;
  /** Called each frame to advance the preview timeline before capture. */
  onSeekFrame: (time: number) => void;
  onProgress: (
    phase: 'rendering' | 'encoding',
    progress: number,
    currentFrame?: number,
    totalFrames?: number
  ) => void;
}

/**
 * Wait two animation frames so React has fully painted after a state update.
 * One rAF is usually enough but two guarantees layout+paint are committed.
 */
function waitForPaint(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export const exportVideo = async (settings: ExportSettings): Promise<string> => {
  const { width, height, fps, duration, quality, canvasElement, onSeekFrame, onProgress } = settings;

  console.log(`${LOG} ─── Export Start ─── ${width}x${height} @ ${fps}fps, duration=${duration}s, quality=${quality}`);
  console.log(`${LOG} Canvas element:`, canvasElement, `size: ${canvasElement.offsetWidth}x${canvasElement.offsetHeight}`);

  const totalFrames = Math.floor(duration * fps);
  console.log(`${LOG} Total frames to render: ${totalFrames}`);

  // ── 1. Load FFmpeg ────────────────────────────────────────────────────────
  console.log(`${LOG} Loading FFmpeg...`);
  const ffmpeg = await getFFmpeg();
  console.log(`${LOG} FFmpeg ready`);

  // ── 2. Init renderer ────────────────────────────────────────────────────────
  const renderer = new ExportRenderer(canvasElement, width, height);
  console.log(`${LOG} ExportRenderer created`);

  // ── 3. Render frames ─────────────────────────────────────────────────────
  const renderStart = performance.now();

  for (let i = 0; i < totalFrames; i++) {
    const time = i / fps;
    const frameLabel = `frame ${i + 1}/${totalFrames} (t=${time.toFixed(3)}s)`;

    try {
      // Seek timeline and wait for React to repaint
      onSeekFrame(time);
      await waitForPaint();

      // Capture DOM
      console.log(`${LOG} Capturing ${frameLabel}...`);
      const captureStart = performance.now();
      const blob = await renderer.captureFrame();
      const captureDuration = (performance.now() - captureStart).toFixed(0);
      console.log(`${LOG} ✓ ${frameLabel} captured in ${captureDuration}ms (${(blob.size / 1024).toFixed(1)}KB)`);

      // Write to FFmpeg virtual FS
      const arrayBuffer = await blob.arrayBuffer();
      const fileName = `frame_${String(i).padStart(4, '0')}.png`;
      await ffmpeg.writeFile(fileName, new Uint8Array(arrayBuffer));
      console.log(`${LOG} ✓ ${fileName} written to ffmpeg FS`);

      // Report progress — (i+1)/totalFrames so it starts at >0%
      const progress = (i + 1) / totalFrames;
      onProgress('rendering', progress, i + 1, totalFrames);

      // Yield to event loop every frame to keep UI responsive
      await new Promise(r => setTimeout(r, 0));

    } catch (err) {
      // Serialize the error properly — html2canvas can throw Event objects
      let errMsg: string;
      if (err instanceof Error) errMsg = `${err.name}: ${err.message}`;
      else if (err instanceof Event) errMsg = `DOMEvent(${err.type}) on ${(err.target as HTMLElement)?.tagName ?? 'unknown'}`;
      else errMsg = String(err);
      console.error(`${LOG} ✗ Error on ${frameLabel}:`, err);
      renderer.dispose();
      throw new Error(`Frame capture failed at frame ${i + 1}: ${errMsg}`);
    }
  }

  const renderDuration = ((performance.now() - renderStart) / 1000).toFixed(1);
  console.log(`${LOG} ✓ All ${totalFrames} frames rendered in ${renderDuration}s`);
  console.log(`${LOG} Average: ${(parseFloat(renderDuration) / totalFrames * 1000).toFixed(0)}ms/frame`);

  // ── 4. Encode with FFmpeg ─────────────────────────────────────────────────
  let crf = '23';
  if (quality === 'High')  crf = '18';
  if (quality === 'Ultra') crf = '14';

  // Use 'ultrafast' preset — dramatically faster than 'slow', minor quality
  // difference that's imperceptible at the typical playback resolutions.
  const ffmpegArgs = [
    '-framerate', String(fps),
    '-i', 'frame_%04d.png',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'ultrafast',
    '-crf', crf,
    // Scale to ensure even dimensions (required by yuv420p)
    '-vf', `scale=${width}:${height}:flags=lanczos`,
    'output.mp4',
  ];

  console.log(`${LOG} Starting FFmpeg encode:`, ffmpegArgs.join(' '));
  const encodeStart = performance.now();

  ffmpeg.on('progress', ({ progress, time: encTime }) => {
    const pct = Math.max(0, Math.min(1, progress ?? 0));
    console.log(`${LOG} FFmpeg encode progress: ${(pct * 100).toFixed(1)}% (time=${encTime})`);
    onProgress('encoding', pct);
  });

  await ffmpeg.exec(ffmpegArgs);

  const encodeDuration = ((performance.now() - encodeStart) / 1000).toFixed(1);
  console.log(`${LOG} ✓ FFmpeg encode complete in ${encodeDuration}s`);

  // ── 5. Retrieve output ────────────────────────────────────────────────────
  console.log(`${LOG} Reading output.mp4 from FFmpeg FS...`);
  const data = await ffmpeg.readFile('output.mp4');
  const mp4Blob = new Blob([data as unknown as ArrayBuffer], { type: 'video/mp4' });
  const url = URL.createObjectURL(mp4Blob);
  console.log(`${LOG} ✓ MP4 blob created: ${(mp4Blob.size / 1024 / 1024).toFixed(2)}MB`);

  // ── 6. Cleanup ────────────────────────────────────────────────────────────
  console.log(`${LOG} Cleaning up FFmpeg virtual FS...`);
  for (let i = 0; i < totalFrames; i++) {
    try { await ffmpeg.deleteFile(`frame_${String(i).padStart(4, '0')}.png`); } catch {}
  }
  try { await ffmpeg.deleteFile('output.mp4'); } catch {}
  renderer.dispose();

  console.log(`${LOG} ─── Export Complete ─── Total: ${((performance.now() - renderStart) / 1000).toFixed(1)}s`);
  return url;
};
