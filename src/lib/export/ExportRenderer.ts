import html2canvas from 'html2canvas';

const LOG = '[ExportRenderer]';

/**
 * DOM-based export renderer using html2canvas.
 *
 * html2canvas walks the DOM and paints each element directly onto a canvas
 * WITHOUT the SVG <foreignObject> approach that html-to-image uses.
 * This avoids:
 *   - "Not allowed to load local resource: data:image/svg+xml" (Chrome/WebKit block)
 *   - CORS errors from Google Fonts stylesheet access (embed-webfonts.js)
 *   - SVG data-URL size limits
 *
 * Quality & viewport-independence strategy:
 *   Scale = targetWidth / element.offsetWidth
 *   This makes html2canvas render an internal canvas that is ALREADY at the
 *   target resolution regardless of how large or small the browser window is.
 *   A small tab or windowed browser produces identical output to a maximised one.
 */
export class ExportRenderer {
  canvasElement: HTMLElement;
  width: number;
  height: number;

  constructor(canvasElement: HTMLElement, width: number, height: number) {
    this.canvasElement = canvasElement;
    this.width = width;
    this.height = height;
  }

  /**
   * Capture the current DOM state as a PNG Blob at the target export resolution.
   *
   * We pass `scale = targetW / elementW` so the html2canvas internal raster
   * is already at full target resolution — no up-scaling artefacts.
   */
  async captureFrame(): Promise<Blob> {
    const captureStart = performance.now();

    const elementW = this.canvasElement.offsetWidth  || 1280;
    const elementH = this.canvasElement.offsetHeight || 720;

    // The scale factor that maps element pixels → target pixels.
    // Use width as the authoritative axis; height follows proportionally.
    const scale = this.width / elementW;

    console.log(`${LOG} element ${elementW}x${elementH}, scale=${scale.toFixed(3)}, target ${this.width}x${this.height}`);

    const sourceCanvas = await html2canvas(this.canvasElement, {
      // Scale up to target resolution during capture — fixes both pixelation
      // and the viewport-size bug (small window = same quality as full-screen).
      scale,
      // Explicit dimensions so html2canvas knows the logical size
      width:  elementW,
      height: elementH,
      // Allow cross-origin images (data: URLs from file input, blob: URLs)
      useCORS:    true,
      allowTaint: true,
      // The element has its own background; null lets it show through correctly
      backgroundColor: null,
      // Suppress html2canvas's internal verbose logging
      logging: false,
      // Skip UI chrome elements marked with data-export-hide="true"
      ignoreElements: (el: Element) =>
        (el as HTMLElement).dataset?.exportHide === 'true',
      imageTimeout: 15000,
      removeContainer: true,
    });

    const captureMs = (performance.now() - captureStart).toFixed(0);
    console.log(`${LOG} html2canvas ${sourceCanvas.width}x${sourceCanvas.height} in ${captureMs}ms`);

    // The source canvas is already at the right size — just export directly.
    return new Promise<Blob>((resolve, reject) => {
      sourceCanvas.toBlob(blob => {
        if (blob) {
          console.log(`${LOG} PNG blob ${(blob.size / 1024).toFixed(1)}KB`);
          resolve(blob);
        } else {
          reject(new Error('sourceCanvas.toBlob returned null'));
        }
      }, 'image/png');
    });
  }

  dispose() {}
}
