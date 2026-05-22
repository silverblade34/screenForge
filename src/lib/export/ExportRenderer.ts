import html2canvas from 'html2canvas';

const LOG = '[ExportRenderer]';

// ─────────────────────────────────────────────────────────────────────────────
// CSS gradient → Canvas 2D helpers
// These parse the CSS gradient strings from BACKGROUNDS (types.ts) and draw
// them natively using the Canvas 2D API, bypassing html2canvas which has a
// known bug where it cannot render `background: gradient(...)` shorthand.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Split comma-separated CSS function arguments, respecting nested parentheses.
 * e.g. "135deg, #0f0c29, #302b63" → ["135deg", "#0f0c29", "#302b63"]
 */
function splitCSSArgs(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') depth--;
    else if (s[i] === ',' && depth === 0) {
      parts.push(s.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(s.slice(start).trim());
  return parts;
}

interface ColorStop { color: string; position: number | null }

/** Parse a single CSS color-stop string: "#ff0000 50%" or "#ff0000" */
function parseColorStop(s: string): ColorStop {
  s = s.trim();
  const lastSpace = s.lastIndexOf(' ');
  if (lastSpace > 0) {
    const maybePct = s.slice(lastSpace + 1);
    if (maybePct.endsWith('%')) {
      return { color: s.slice(0, lastSpace).trim(), position: parseFloat(maybePct) / 100 };
    }
  }
  return { color: s, position: null };
}

/** Evenly distribute any color stops that have position=null */
function distributeStops(raw: ColorStop[]): Array<{ color: string; position: number }> {
  return raw.map((s, i) => ({
    color: s.color,
    position: s.position ?? i / Math.max(1, raw.length - 1),
  }));
}

/**
 * Draw any CSS background value onto a Canvas 2D context using the native API.
 * Supported formats:
 *   - solid hex/rgb:      "#000000" | "rgb(0,0,0)"
 *   - linear-gradient:   "linear-gradient(135deg, #a, #b, #c)"
 *   - radial-gradient:   "radial-gradient(ellipse at center, #a 0%, #b 70%)"
 */
function drawNativeBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bg: string,
): void {
  bg = bg.trim();

  if (!bg || bg === 'none' || bg === 'transparent') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    return;
  }

  // Solid colour
  if (bg.startsWith('#') || bg.startsWith('rgb') || bg.startsWith('hsl')) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  // ── Linear gradient ─────────────────────────────────────────────────────────
  if (bg.startsWith('linear-gradient(')) {
    const inner = bg.slice('linear-gradient('.length, -1);
    const args  = splitCSSArgs(inner);

    let angleDeg = 180; // default: to bottom
    let startIdx = 0;

    const first = args[0].trim();
    if (first.endsWith('deg')) {
      angleDeg = parseFloat(first);
      startIdx = 1;
    } else if (first.startsWith('to ')) {
      const dir = first.slice(3).trim();
      const map: Record<string, number> = {
        'top': 0, 'right': 90, 'bottom': 180, 'left': 270,
        'top right': 45, 'bottom right': 135, 'bottom left': 225, 'top left': 315,
      };
      angleDeg = map[dir] ?? 180;
      startIdx = 1;
    }

    const stops = distributeStops(args.slice(startIdx).map(parseColorStop));

    // CSS angle: 0deg = to top, 90deg = to right — convert to canvas direction
    const rad = (angleDeg * Math.PI) / 180;
    // Length of gradient line that covers the whole rectangle at this angle
    const len = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
    const cx = w / 2;
    const cy = h / 2;
    const x0 = cx - (len / 2) * Math.sin(rad);
    const y0 = cy + (len / 2) * Math.cos(rad);
    const x1 = cx + (len / 2) * Math.sin(rad);
    const y1 = cy - (len / 2) * Math.cos(rad);

    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    for (const s of stops) {
      try { grad.addColorStop(s.position, s.color); } catch {}
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  // ── Radial gradient ─────────────────────────────────────────────────────────
  if (bg.startsWith('radial-gradient(')) {
    const inner = bg.slice('radial-gradient('.length, -1);
    const args  = splitCSSArgs(inner);

    let cx = w / 2;
    let cy = h / 2;
    let startIdx = 0;

    // Check if first arg describes shape / position
    const first = args[0].trim();
    if (
      first.startsWith('ellipse') ||
      first.startsWith('circle') ||
      first.startsWith('closest') ||
      first.startsWith('farthest')
    ) {
      const atIdx = first.indexOf(' at ');
      if (atIdx > -1) {
        const pos = first.slice(atIdx + 4).trim();
        const posMap: Record<string, [number, number]> = {
          'center':       [w / 2, h / 2],
          'top':          [w / 2, 0],
          'bottom':       [w / 2, h],
          'left':         [0,     h / 2],
          'right':        [w,     h / 2],
          'top left':     [0,     0],
          'top right':    [w,     0],
          'bottom left':  [0,     h],
          'bottom right': [w,     h],
        };
        if (posMap[pos]) [cx, cy] = posMap[pos];
      }
      startIdx = 1;
    }

    const radius = Math.sqrt(cx * cx + cy * cy) * 1.5; // farthest-corner approx
    const stops  = distributeStops(args.slice(startIdx).map(parseColorStop));

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    for (const s of stops) {
      try { grad.addColorStop(s.position, s.color); } catch {}
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  // Fallback
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, w, h);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * DOM-based export renderer using html2canvas.
 *
 * Background strategy:
 *   html2canvas cannot render CSS `background: gradient(...)` shorthands.
 *   We work around this by:
 *   1. Reading the raw CSS background string from the element's `data-bg` attribute
 *      (set by CanvasArea.tsx via data-bg={bgRaw}).
 *   2. Capturing the DOM with `backgroundColor: null` (transparent).
 *   3. Drawing the background natively with Canvas 2D API.
 *   4. Compositing the DOM capture on top.
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

  async captureFrame(): Promise<Blob> {
    const t0 = performance.now();

    const elementW = this.canvasElement.offsetWidth  || 1280;
    const elementH = this.canvasElement.offsetHeight || 720;
    const scale    = this.width / elementW;

    console.log(`${LOG} element ${elementW}×${elementH} scale=${scale.toFixed(3)} → ${this.width}×${this.height}`);

    // ── Read the raw background string we stored in the data attribute ────────
    const bgValue = (this.canvasElement as HTMLElement).dataset.bg ?? '';
    console.log(`${LOG} bg value from data-bg: "${bgValue}"`);

    // ── Capture DOM (transparent bg so we can composite manually) ─────────────
    const domCanvas = await html2canvas(this.canvasElement, {
      scale,
      width:  elementW,
      height: elementH,
      useCORS:    true,
      allowTaint: true,
      backgroundColor: null,          // transparent — we paint bg ourselves
      ignoreElements: (el: Element) =>
        (el as HTMLElement).dataset?.exportHide === 'true',
      imageTimeout: 15000,
      removeContainer: true,
    });

    console.log(`${LOG} html2canvas ${domCanvas.width}×${domCanvas.height} in ${(performance.now() - t0).toFixed(0)}ms`);

    // ── Build composite: background + DOM ────────────────────────────────────
    const out = document.createElement('canvas');
    out.width  = domCanvas.width;
    out.height = domCanvas.height;
    const ctx  = out.getContext('2d')!;

    // 1. Paint background natively (Canvas 2D API supports all gradients)
    drawNativeBackground(ctx, out.width, out.height, bgValue);

    // 2. Paint DOM capture on top
    ctx.drawImage(domCanvas, 0, 0);

    // ── Return PNG blob ───────────────────────────────────────────────────────
    return new Promise<Blob>((resolve, reject) => {
      out.toBlob(blob => {
        if (blob) {
          console.log(`${LOG} PNG blob ${(blob.size / 1024).toFixed(1)} KB`);
          resolve(blob);
        } else {
          reject(new Error('out.toBlob returned null'));
        }
      }, 'image/png');
    });
  }

  dispose() {}
}
