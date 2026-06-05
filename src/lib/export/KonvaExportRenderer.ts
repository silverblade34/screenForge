import Konva from 'konva';

const LOG = '[KonvaExportRenderer]';

/**
 * Konva-based frame renderer.
 *
 * Replaces ExportRenderer (html2canvas) with stage.toBlob().
 *
 * Key advantages over html2canvas:
 * - Captures <video> frames correctly (ctx.drawImage natively)
 * - No CORS issues for dataURL videos
 * - No gradient rendering bugs
 * - ~5-10x faster per frame
 *
 * pixelRatio: we use window.devicePixelRatio (typically 2 on retina) so
 * stage.toBlob produces a 2× physical pixel image. FFmpeg will scale it
 * back to the requested export resolution.
 */
export class KonvaExportRenderer {
  private stage: Konva.Stage;
  private pixelRatio: number;

  constructor(stage: Konva.Stage, pixelRatio?: number) {
    this.stage = stage;
    this.pixelRatio = pixelRatio ?? window.devicePixelRatio ?? 2;
    console.log(`${LOG} created — stage ${stage.width()}×${stage.height()}, pixelRatio=${this.pixelRatio}`);
  }

  /**
   * Capture the current stage as a PNG Blob.
   *
   * Called once per frame during export; the caller has already seeked
   * the timeline and waited two rAFs for React/Konva to repaint.
   */
  async captureFrame(): Promise<Blob> {
    const t0 = performance.now();

    return new Promise<Blob>((resolve, reject) => {
      this.stage.toBlob({
        mimeType: 'image/png',
        quality: 1,
        pixelRatio: this.pixelRatio,
        callback: (blob) => {
          const ms = (performance.now() - t0).toFixed(0);
          if (blob) {
            console.log(`${LOG} frame captured in ${ms}ms (${(blob.size / 1024).toFixed(1)}KB)`);
            resolve(blob);
          } else {
            reject(new Error('stage.toBlob returned null'));
          }
        },
      });
    });
  }

  /** No-op — Konva stage is owned by React, no cleanup needed here. */
  dispose() {}
}
