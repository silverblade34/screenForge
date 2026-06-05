'use client';

/**
 * KonvaStage.tsx
 *
 * Replaces CanvasArea.tsx with a Konva-based rendering pipeline.
 *
 * Architecture:
 *   - Konva Stage (ref exposed via forwardRef / useImperativeHandle)
 *     ├── BackgroundLayer  → Konva.Rect with native gradient fill
 *     ├── DeviceLayer      → drawn natively on canvas (no html-to-image)
 *     │     └── VideoImage → Konva.Image of HTMLVideoElement (with clipFunc)
 *     └── TextLayer        → Konva.Text[] for each active TextLayer
 *
 * Camera:
 *   tiltX / tiltY are 3D CSS transforms that Konva cannot replicate natively.
 *   We keep them in a DOM wrapper (`cameraStage` div) that uses CSS perspective,
 *   and let Konva handle zoom / panX / panY / rotation via a Konva.Group.
 *
 * Export:
 *   A ref to the Konva.Stage is forwarded out so page.tsx can instantiate
 *   KonvaExportRenderer(stageRef.current) instead of ExportRenderer.
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Text as KonvaText, Group, Shape } from 'react-konva';
import Konva from 'konva';

import {
  SceneScene, DeviceModel, FrameColor, BackgroundOption,
  AnimationPreset, EasingType, Layer as LayerType, CameraState, TextLayer,
} from './types';
import { useVideoTexture } from '@/hooks/useVideoTexture';
import { useKonvaAnimation } from '@/hooks/useKonvaAnimation';

import useImage from 'use-image';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface KonvaStageHandle {
  stage: Konva.Stage | null;
}

interface KonvaStageProps {
  activeScene: SceneScene;
  scenes: SceneScene[];
  isPlaying: boolean;
  currentTime: number;
  device: DeviceModel;
  frameColor: FrameColor;
  deviceScale: number;
  background: BackgroundOption;
  browserVariant?: any;
  layers: LayerType[];
  camera: CameraState;

  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDeviceScreenClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleSceneSeek: (id: string) => void;
  handlePlayPause: () => void;
  addScene: () => void;
  animKey: number;

  textLayers?: TextLayer[];
  activeTextLayerId?: string | null;
  editingTextLayerId?: string | null;
  setActiveTextLayerId?: (id: string | null) => void;
  setEditingTextLayerId?: (id: string | null) => void;
  updateTextLayer?: (id: string, updates: Partial<TextLayer>) => void;

  isExporting?: boolean;
  videoFileInputRef?: React.RefObject<HTMLInputElement | null>;
  handleVideoFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Called when user removes the current media (image/video) */
  onRemoveMedia?: () => void;
  /** Called when user clicks "Add media" placeholder (legacy, optional) */
  onAddMediaClick?: () => void;
  /** Media library for inline picker */
  mediaLibrary?: import('./types').MediaAsset[];
  onSelectMedia?: (asset: import('./types').MediaAsset) => void;
  onDeleteMedia?: (id: string) => void;
}

// ── Frame color palette ────────────────────────────────────────────────────────

const frameColors: Record<string, {
  base: string; highlight: string; shadow: string; metallicGradient: string[];
}> = {
  spaceBlack:      { base: '#151516', highlight: '#3a3a3c', shadow: '#0b0b0c', metallicGradient: ['#2c2d30', '#151516', '#0b0b0c'] },
  spaceGray:       { base: '#3a3d40', highlight: '#63666a', shadow: '#222326', metallicGradient: ['#53565a', '#3a3d40', '#222326'] },
  silver:          { base: '#d1d5db', highlight: '#f3f4f6', shadow: '#9ca3af', metallicGradient: ['#f9fafb', '#e5e7eb', '#d1d5db'] },
  midnight:        { base: '#1e293b', highlight: '#334155', shadow: '#0f172a', metallicGradient: ['#2e3b4e', '#1e293b', '#0f172a'] },
  starlight:       { base: '#e2dcd0', highlight: '#f4f0ea', shadow: '#c4bcae', metallicGradient: ['#faf8f5', '#e2dcd0', '#c4bcae'] },
  naturalTitanium: { base: '#a8a297', highlight: '#c7c2b9', shadow: '#857f75', metallicGradient: ['#bebaa7', '#a8a297', '#857f75'] },
  titaniumBlue:    { base: '#374754', highlight: '#55697a', shadow: '#242f38', metallicGradient: ['#475a6b', '#374754', '#242f38'] },
  gold:            { base: '#e5c199', highlight: '#f5dec2', shadow: '#b28e67', metallicGradient: ['#fcead2', '#e5c199', '#b28e67'] },
  skyBlue:         { base: '#050A10', highlight: '#8AB4F8', shadow: '#174EA6', metallicGradient: ['#a5c7f7', '#8AB4F8', '#174EA6'] },
  lightGold:       { base: '#0F0D0A', highlight: '#FDE293', shadow: '#B08D55', metallicGradient: ['#fcead2', '#e5c199', '#b28e67'] },
  cloudWhite:      { base: '#0A0A0A', highlight: '#F2F2F7', shadow: '#D1D1D6', metallicGradient: ['#ffffff', '#f3f4f6', '#d1d5db'] },
  titanium:        { base: '#0A0A0A', highlight: '#AEAEB2', shadow: '#636366', metallicGradient: ['#c7c2b9', '#a8a297', '#636366'] },
};

// ── Gradient parser → Konva props ─────────────────────────────────────────────

interface ParsedGradient {
  type: 'solid' | 'linear' | 'radial';
  color?: string;
  stops?: Array<{ offset: number; color: string }>;
  angleDeg?: number;
  cx?: number;
  cy?: number;
}

function parseCSSGradient(bg: string, w: number, h: number): ParsedGradient {
  bg = (bg || '').trim();

  if (!bg || bg === 'none') {
    return { type: 'solid', color: '#000000' };
  }
  if (bg === 'transparent') {
    return { type: 'solid', color: 'transparent' };
  }

  if (bg.startsWith('#') || bg.startsWith('rgb') || bg.startsWith('hsl')) {
    return { type: 'solid', color: bg };
  }

  function splitArgs(s: string): string[] {
    const parts: string[] = [];
    let depth = 0, start = 0;
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

  function parseStop(s: string): { offset: number | null; color: string } {
    s = s.trim();
    const lastSpace = s.lastIndexOf(' ');
    if (lastSpace > 0) {
      const maybePct = s.slice(lastSpace + 1);
      if (maybePct.endsWith('%')) {
        return { color: s.slice(0, lastSpace).trim(), offset: parseFloat(maybePct) / 100 };
      }
    }
    return { color: s, offset: null };
  }

  function distributeStops(raw: Array<{ offset: number | null; color: string }>) {
    return raw.map((s, i) => ({
      color: s.color,
      offset: s.offset ?? i / Math.max(1, raw.length - 1),
    }));
  }

  if (bg.startsWith('linear-gradient(')) {
    const inner = bg.slice('linear-gradient('.length, -1);
    const args = splitArgs(inner);
    let angleDeg = 180, startIdx = 0;
    const first = args[0].trim();
    if (first.endsWith('deg')) { angleDeg = parseFloat(first); startIdx = 1; }
    else if (first.startsWith('to ')) {
      const map: Record<string, number> = { top: 0, right: 90, bottom: 180, left: 270, 'top right': 45, 'bottom right': 135, 'bottom left': 225, 'top left': 315 };
      angleDeg = map[first.slice(3).trim()] ?? 180;
      startIdx = 1;
    }
    const stops = distributeStops(args.slice(startIdx).map(parseStop));
    return { type: 'linear', angleDeg, stops };
  }

  if (bg.startsWith('radial-gradient(')) {
    const inner = bg.slice('radial-gradient('.length, -1);
    const args = splitArgs(inner);
    let cx = w / 2, cy = h / 2, startIdx = 0;
    const first = args[0].trim();
    if (first.startsWith('ellipse') || first.startsWith('circle')) {
      const atIdx = first.indexOf(' at ');
      if (atIdx > -1) {
        const posMap: Record<string, [number, number]> = {
          center: [w / 2, h / 2], top: [w / 2, 0], bottom: [w / 2, h],
          left: [0, h / 2], right: [w, h / 2],
        };
        const pos = first.slice(atIdx + 4).trim();
        if (posMap[pos]) [cx, cy] = posMap[pos];
      }
      startIdx = 1;
    }
    const stops = distributeStops(args.slice(startIdx).map(parseStop));
    return { type: 'radial', cx, cy, stops };
  }

  return { type: 'solid', color: bg || '#111111' };
}

// ── Background Layer ──────────────────────────────────────────────────────────

function BackgroundLayer({ background, width, height }: { background: BackgroundOption; width: number; height: number }) {
  const bg = (background.style?.background as string | undefined) ?? '';
  const parsed = parseCSSGradient(bg, width, height);

  const rectProps: any = {
    x: 0, y: 0, width, height,
  };

  if (parsed.type === 'solid') {
    rectProps.fill = parsed.color;
  } else if (parsed.type === 'linear' && parsed.stops) {
    const rad = ((parsed.angleDeg ?? 180) * Math.PI) / 180;
    const len = Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad));
    const cx = width / 2, cy = height / 2;
    rectProps.fillLinearGradientStartPoint = { x: cx - (len / 2) * Math.sin(rad), y: cy + (len / 2) * Math.cos(rad) };
    rectProps.fillLinearGradientEndPoint   = { x: cx + (len / 2) * Math.sin(rad), y: cy - (len / 2) * Math.cos(rad) };
    rectProps.fillLinearGradientColorStops = parsed.stops.flatMap(s => [s.offset, s.color]);
  } else if (parsed.type === 'radial' && parsed.stops) {
    const radius = Math.sqrt((parsed.cx ?? width / 2) ** 2 + (parsed.cy ?? height / 2) ** 2) * 1.5;
    rectProps.fillRadialGradientStartPoint  = { x: parsed.cx ?? width / 2, y: parsed.cy ?? height / 2 };
    rectProps.fillRadialGradientEndPoint    = { x: parsed.cx ?? width / 2, y: parsed.cy ?? height / 2 };
    rectProps.fillRadialGradientStartRadius = 0;
    rectProps.fillRadialGradientEndRadius   = radius;
    rectProps.fillRadialGradientColorStops  = parsed.stops.flatMap(s => [s.offset, s.color]);
  } else {
    rectProps.fill = '#111111';
  }

  return (
    <Layer>
      <Rect {...rectProps} />
    </Layer>
  );
}

// ── Native Canvas iPhone Frame ─────────────────────────────────────────────────
/**
 * Draws the iPhone frame entirely on canvas using Konva.Shape.
 * This replaces html-to-image capture and correctly renders the metallic
 * outer ring (which was a ::before pseudo-element at z-index:-1).
 */

interface DeviceFrameDimensions {
  screenW: number;
  screenH: number;
  screenRadius: number;
  frameW: number;
  frameH: number;
  diW: number;         // dynamic island width
  diH: number;
}

function getIphoneDimensions(device: string, scale: number): DeviceFrameDimensions {
  // Shots.so logic: base dimensions on the SCREEN size, then scale the frame image up.
  const screenW = 320 * (scale / 100);
  const aspectRatio = 402 / 874; // Shots.so standard portrait screen aspect
  const screenH = screenW / aspectRatio;
  
  const assetScale = 1.248; // Shots.so device asset scale
  const frameW = screenW * assetScale;
  const frameH = screenH * assetScale;

  return {
    screenW,
    screenH,
    screenRadius: 46 * (scale / 100),
    frameW,
    frameH,
    diW: (device.includes('17-pro') || device.includes('16-pro')) ? 105 * (scale / 100) :
         (device.includes('15') && !device.includes('pro')) ? 95 * (scale / 100) : 100 * (scale / 100),
    diH: 24 * (scale / 100),
  };
}

// ── Konva Device Frame Image ──────────────────────────────────────────────────

interface ImageDeviceFrameProps {
  device: string;
  frameColor: string;
  deviceScale: number;
}

function ImageDeviceFrame({ device, frameColor, deviceScale }: ImageDeviceFrameProps) {
  const dim = getIphoneDimensions(device, deviceScale);
  
  // The parent Group has offsetX/Y = stageW/2, stageH/2 so (0,0) = stage center
  // Place frame centered at origin
  const frameX = -dim.frameW / 2;
  const frameY = -dim.frameH / 2;

  // Load the corresponding frame image from public/frames/
  const [image] = useImage(`/frames/${frameColor}-device.png`);

  if (!image) return null;

  return (
    <KonvaImage
      image={image}
      x={frameX}
      y={frameY}
      width={dim.frameW}
      height={dim.frameH}
      listening={false}
    />
  );
}


function KonvaStaticImage({ src, x, y, width, height, mode, scrollProgress }: any) {
  const [img] = useImage(src, 'anonymous');
  const [bounds, setBounds] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

  useEffect(() => {
    if (!img) {
      setBounds(null);
      return;
    }
    // Automatically find bounding box of non-transparent pixels
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      setBounds({ x: 0, y: 0, width: img.width, height: img.height });
      return;
    }
    ctx.drawImage(img, 0, 0);
    try {
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;
      let top = null, bottom = null, left = null, right = null;
      for (let py = 0; py < img.height; py++) {
        for (let px = 0; px < img.width; px++) {
          const alpha = data[(py * img.width + px) * 4 + 3];
          if (alpha > 10) {
            if (top === null) top = py;
            bottom = py;
            if (left === null || px < left) left = px;
            if (right === null || px > right) right = px;
          }
        }
      }
      if (top !== null && bottom !== null && left !== null && right !== null) {
        setBounds({ x: left, y: top, width: right - left + 1, height: bottom - top + 1 });
      } else {
        setBounds({ x: 0, y: 0, width: img.width, height: img.height });
      }
    } catch (e) {
      setBounds({ x: 0, y: 0, width: img.width, height: img.height });
    }
  }, [img]);

  if (!img || !bounds) return null;

  const screenAspect = width / height;
  const contentAspect = bounds.width / bounds.height;

  let cropWidth = bounds.width;
  let cropHeight = bounds.height;
  let cropX = 0;
  let cropY = 0;

  if (mode === 'scroll') {
    // Scroll mode: fit width, scroll vertically
    cropWidth = bounds.width;
    cropHeight = bounds.width / screenAspect;

    if (cropHeight > bounds.height) {
      // Image is too short to scroll, fallback to cover
      cropHeight = bounds.height;
      cropWidth = bounds.height * screenAspect;
      cropX = (bounds.width - cropWidth) / 2;
    } else {
      const maxScroll = bounds.height - cropHeight;
      cropY = maxScroll * scrollProgress;
    }
  } else {
    // Animation mode: object-fit: cover
    if (contentAspect > screenAspect) {
      // Image is wider than screen -> crop sides
      cropHeight = bounds.height;
      cropWidth = bounds.height * screenAspect;
      cropX = (bounds.width - cropWidth) / 2;
    } else {
      // Image is taller than screen -> crop top/bottom
      cropWidth = bounds.width;
      cropHeight = bounds.width / screenAspect;
      cropY = (bounds.height - cropHeight) / 2;
    }
  }

  return (
    <KonvaImage 
      image={img} 
      x={x} y={y} width={width} height={height} 
      crop={{ 
        x: bounds.x + cropX, 
        y: bounds.y + cropY, 
        width: cropWidth, 
        height: cropHeight 
      }}
      listening={false}
    />
  );
}

// ── Helper: get screen rect for device (in group-local coords, center = 0,0) ─
function getScreenRect(device: DeviceModel, deviceScale: number, cx: number, cy: number) {
  if (device === 'browser' || device === 'macbook-pro' || device === 'none') {
    const w = 600 * (deviceScale / 100);
    const h = 400 * (deviceScale / 100);
    // Group center = 0,0, so center this rect
    return { x: -w / 2, y: -h / 2, w, h, radius: 8 };
  }

  const dim = getIphoneDimensions(device, deviceScale);
  return {
    x: -dim.screenW / 2,
    y: -dim.screenH / 2,
    w: dim.screenW,
    h: dim.screenH,
    radius: dim.screenRadius,
  };
}

// ── Text Layer Renderer ────────────────────────────────────────────────────────

function KonvaTextLayers({
  textLayers,
  currentTime,
  stageWidth,
  stageHeight,
  activeTextLayerId,
  setActiveTextLayerId,
  setEditingTextLayerId,
  updateTextLayer,
  isExporting,
}: {
  textLayers: TextLayer[];
  currentTime: number;
  stageWidth: number;
  stageHeight: number;
  activeTextLayerId?: string | null;
  setActiveTextLayerId?: (id: string | null) => void;
  setEditingTextLayerId?: (id: string | null) => void;
  updateTextLayer?: (id: string, updates: Partial<TextLayer>) => void;
  isExporting?: boolean;
}) {
  return (
    <Layer>
      {textLayers.map(layer => {
        if (layer.hidden) return null;

        const startTime = layer.startTime ?? 0;
        const duration = layer.duration ?? 3;
        const localT = currentTime - startTime;

        if (localT < 0 || localT > duration) return null;

        // Animation entrance
        const animInDur = 0.5;
        const inProg = Math.min(1, Math.max(0, localT / animInDur));
        let opacity = (layer.opacity ?? 1);
        let y = (layer.y / 100) * stageHeight;

        if (layer.animationIn === 'fade') {
          opacity *= inProg;
        } else if (layer.animationIn === 'slide-up') {
          opacity *= inProg;
          y += (1 - inProg) * 30;
        } else if (layer.animationIn === 'bounce') {
          opacity *= inProg;
        }

        // Typewriter text
        let displayText = layer.text;
        if (layer.animationIn === 'typewriter') {
          const charsToShow = Math.floor(localT * 20);
          if (charsToShow < layer.text.length) {
            displayText = layer.text.substring(0, charsToShow);
          }
        }

        const x = (layer.x / 100) * stageWidth;
        const width = layer.width ?? 700;

        const textProps: any = {
          x: x - width / 2,
          y: y,
          width,
          text: displayText,
          fontSize: layer.fontSize,
          fontFamily: layer.fontFamily,
          fontStyle: String(layer.fontWeight),
          align: layer.align,
          opacity,
          letterSpacing: layer.letterSpacing,
          lineHeight: layer.lineHeight,
          rotation: layer.rotation ?? 0,
          draggable: !isExporting && !layer.locked,
          listening: !isExporting,
        };

        if (layer.gradient && layer.gradientFrom && layer.gradientTo) {
          textProps.fillLinearGradientStartPoint = { x: 0, y: 0 };
          textProps.fillLinearGradientEndPoint = { x: width, y: 0 };
          textProps.fillLinearGradientColorStops = [0, layer.gradientFrom, 1, layer.gradientTo];
        } else {
          textProps.fill = layer.color;
        }

        if (layer.shadow) {
          textProps.shadowColor = 'rgba(0,0,0,0.5)';
          textProps.shadowBlur = 24;
          textProps.shadowOffsetY = 4;
        }

        if ((layer.glow ?? 0) > 0) {
          textProps.shadowColor = layer.color;
          textProps.shadowBlur = layer.glow;
          textProps.shadowOpacity = 0.8;
        }

        return (
          <KonvaText
            key={layer.id}
            {...textProps}
            onDragEnd={(e) => {
              if (!updateTextLayer) return;
              const newX = (e.target.x() + width / 2) / stageWidth * 100;
              const newY = e.target.y() / stageHeight * 100;
              updateTextLayer(layer.id, { x: newX, y: newY });
            }}
            onClick={() => setActiveTextLayerId?.(layer.id)}
            onDblClick={() => setEditingTextLayerId?.(layer.id)}
          />
        );
      })}
    </Layer>
  );
}

// ── Main KonvaStage ───────────────────────────────────────────────────────────

const KonvaStage = forwardRef<KonvaStageHandle, KonvaStageProps>(function KonvaStage({
  activeScene,
  scenes,
  isPlaying,
  currentTime,
  device,
  frameColor,
  deviceScale,
  background,
  browserVariant,
  layers,
  camera,
  fileInputRef,
  handleFileChange,
  handleDrop,
  handleDeviceScreenClick,
  handleSceneSeek,
  handlePlayPause,
  addScene,
  animKey,
  textLayers = [],
  activeTextLayerId,
  editingTextLayerId,
  setActiveTextLayerId,
  setEditingTextLayerId,
  updateTextLayer,
  isExporting,
  videoFileInputRef,
  handleVideoFileChange,
  onRemoveMedia,
  onAddMediaClick,
  mediaLibrary = [],
  onSelectMedia,
  onDeleteMedia,
}, ref) {
  // ── Stage size ──────────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 1280, height: 720 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setStageSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Expose stage ref ────────────────────────────────────────────────────────
  const stageRef = useRef<Konva.Stage>(null);
  useImperativeHandle(ref, () => ({ stage: stageRef.current }), []);

  // ── Compute local time and scene index ─────────────────────────────────────
  let currentSceneIndex = 0, localTime = 0, acc = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (currentTime >= acc && currentTime < acc + scenes[i].duration) {
      currentSceneIndex = i; localTime = currentTime - acc; break;
    }
    acc += scenes[i].duration;
    if (i === scenes.length - 1 && currentTime >= acc) {
      currentSceneIndex = i; localTime = scenes[i].duration;
    }
  }

  // ── Effective camera (with interpolation between scenes) ──────────────────
  let effectiveCamera = { ...camera };
  const transitionDuration = 0.6;
  if (currentSceneIndex > 0 && localTime < transitionDuration) {
    const prev = scenes[currentSceneIndex - 1].camera;
    const next = scenes[currentSceneIndex].camera;
    let t = localTime / transitionDuration;
    t = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // easeOutExpo
    effectiveCamera = {
      zoom:     prev.zoom     + (next.zoom     - prev.zoom)     * t,
      panX:     prev.panX     + (next.panX     - prev.panX)     * t,
      panY:     prev.panY     + (next.panY     - prev.panY)     * t,
      tiltX:    prev.tiltX    + (next.tiltX    - prev.tiltX)    * t,
      tiltY:    prev.tiltY    + (next.tiltY    - prev.tiltY)    * t,
      rotation: prev.rotation + (next.rotation - prev.rotation) * t,
      blur:     prev.blur     + (next.blur     - prev.blur)     * t,
    };
  }

  // ── Video texture ───────────────────────────────────────────────────────────
  const videoEl = useVideoTexture({
    src: activeScene.mode === 'video' ? activeScene.video ?? null : null,
    isPlaying,
    loop: true,
    muted: true,
    playbackRate: activeScene.videoPlaybackRate ?? 1,
    trimStart: activeScene.videoTrimStart ?? 0,
    trimEnd: activeScene.videoTrimEnd,
    seekTime: localTime,
  });

  // ── Konva.Animation to tick video frames ────────────────────────────────────
  const videoAnimRef = useRef<Konva.Animation | null>(null);
  const deviceLayerRef = useRef<Konva.Layer>(null);

  useEffect(() => {
    if (!videoEl || !deviceLayerRef.current) return;

    const anim = new Konva.Animation(() => {
      // Konva redraws the layer — KonvaImage internally calls ctx.drawImage(videoEl)
    }, deviceLayerRef.current);

    anim.start();
    videoAnimRef.current = anim;

    return () => {
      anim.stop();
      videoAnimRef.current = null;
    };
  }, [videoEl]);

  // ── Device Group: Konva 2D camera (zoom, pan, rotation) ──────────────────
  const deviceGroupRef = useRef<Konva.Group>(null);

  // ── Animation preset on device group ─────────────────────────────────────
  // Disable continuous animation in video/scroll modes, but allow entrance animations.
  const ENTRANCE_ANIMATIONS = ['none', 'hero-reveal', 'cinematic-push', 'precision-zoom', 'focus-pull', 'camera-slide'];
  const effectivePreset: AnimationPreset = (activeScene.mode !== 'animation' && !ENTRANCE_ANIMATIONS.includes(activeScene.animationPreset))
    ? 'none'
    : activeScene.animationPreset;

  useKonvaAnimation({
    groupRef: deviceGroupRef,
    preset: effectivePreset,
    localTime,
    isLive: isPlaying && !isExporting,
    baseX: 0,
    baseY: 0,
  });

  // ── Device layer: compute position and size ───────────────────────────────
  const deviceLayer = layers.find(l => l.id === 'device');

  const dim = getIphoneDimensions(device, deviceScale);

  // Center coords of the stage
  const centerX = stageSize.width / 2;
  const centerY = stageSize.height / 2;

  // ── Screen area rect (in group-local coords, origin = 0,0 = stage center) ─
  const screen = getScreenRect(device, deviceScale, centerX, centerY);

  // ── Scroll mode ───────────────────────────────────────────────────────────
  let scrollProgress = 0;
  if (activeScene.mode === 'scroll' && activeScene.image) {
    const scrollDur = activeScene.scrollSpeed || 6;
    scrollProgress = Math.min(1, localTime / scrollDur);
  }

  // ── Screen clip func ──────────────────────────────────────────────────────
  const screenClipFunc = useCallback((ctx: any) => {
    if (ctx.roundRect) {
      ctx.roundRect(screen.x, screen.y, screen.w, screen.h, screen.radius);
    } else {
      ctx.rect(screen.x, screen.y, screen.w, screen.h);
    }
  }, [screen.x, screen.y, screen.w, screen.h, screen.radius]);

  // ── Hover & Picker state ─────────────────────────────────────────
  const [mediaHovered, setMediaHovered] = useState(false);
  const [emptyHovered, setEmptyHovered] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Fixed-viewport anchor for the picker panel (computed from containerRef bounding rect)
  const [pickerAnchor, setPickerAnchor] = useState<{ x: number; top: number } | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // ── Compute device screen position for DOM overlays ──────────────────────
  // screen.x/y is in group coords (center = 0,0)
  // Camera group is at (stageW/2 + panX, stageH/2 + panY) with scale=zoom
  // So stage coords of screen top-left:
  //   stageX = (centerX + panX) + screen.x * zoom
  //   stageY = (centerY + panY) + screen.y * zoom
  const realScreenX = centerX + effectiveCamera.panX + screen.x * effectiveCamera.zoom;
  const realScreenY = centerY + effectiveCamera.panY + screen.y * effectiveCamera.zoom;

  const overlayLeft   = (realScreenX / stageSize.width) * 100;
  const overlayTop    = (realScreenY / stageSize.height) * 100;
  const overlayWidth  = (screen.w * effectiveCamera.zoom) / stageSize.width * 100;
  const overlayHeight = (screen.h * effectiveCamera.zoom) / stageSize.height * 100;

  // Compute fixed-position anchor whenever picker opens
  useEffect(() => {
    if (!pickerOpen) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Anchor to the top-center of the canvas container, ignoring device position
    setPickerAnchor({ 
      x: rect.left + rect.width / 2, 
      top: rect.top + 40 
    });
  }, [pickerOpen]);

  // Close picker when clicking outside
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  const hasMedia = !!(activeScene.mode === 'video' ? activeScene.video : activeScene.image);

  return (
    <>
      {/* ── Hidden file inputs ─────────────────────────────────────────────── */}
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
      <input type="file" accept="video/*,video/mp4,video/webm,video/quicktime"
        ref={videoFileInputRef as React.RefObject<HTMLInputElement>}
        onChange={handleVideoFileChange}
        style={{ display: 'none' }} />

      {/* ── CSS 3D camera wrapper for tiltX/tiltY ────────────────────────── */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          perspective: '1200px',
          transform: `rotateX(${effectiveCamera.tiltX}deg) rotateY(${effectiveCamera.tiltY}deg)`,
          transformStyle: 'preserve-3d',
          filter: effectiveCamera.blur > 0 ? `blur(${effectiveCamera.blur}px)` : undefined,
        }}
      >
        {/* ── Stage container ────────────────────────────────────────────── */}
        <div
          ref={containerRef}
          style={{ width: '100%', height: '100%', position: 'relative' }}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            pixelRatio={window.devicePixelRatio || 2}
          >
            {/* ── 1. Background ─────────────────────────────────────────── */}
            <BackgroundLayer background={background} width={stageSize.width} height={stageSize.height} />

            {/* ── 2. Device Layer ───────────────────────────────────────── */}
            <Layer ref={deviceLayerRef}>
              {/* Camera Group: places origin at stage center, applies zoom/pan/rotation */}
              <Group
                x={stageSize.width / 2 + effectiveCamera.panX}
                y={stageSize.height / 2 + effectiveCamera.panY}
                scaleX={effectiveCamera.zoom}
                scaleY={effectiveCamera.zoom}
                rotation={effectiveCamera.rotation}
                opacity={deviceLayer ? (deviceLayer.visible ? deviceLayer.opacity / 100 : 0) : 1}
              >
                {/* Animation Group: handles intro animations. Origin = stage center. */}
                <Group ref={deviceGroupRef}>

                  {/* ── Screen background fill (always dark, clipped to phone screen) ──
                      Must be INSIDE this animated group so it moves with the frame. */}
                  <Group clipFunc={screenClipFunc}>
                    <Rect
                      x={screen.x} y={screen.y}
                      width={screen.w} height={screen.h}
                      fill="#0a0a0a"
                      listening={false}
                    />

                    {/* Static Image (animation/scroll) inside device screen */}
                    {activeScene.mode !== 'video' && activeScene.image && (
                      <KonvaStaticImage 
                        src={activeScene.image}
                        x={screen.x} y={screen.y} width={screen.w} height={screen.h}
                        mode={activeScene.mode}
                        scrollProgress={scrollProgress}
                      />
                    )}

                    {/* Video inside device screen (behind frame) */}
                    {activeScene.mode === 'video' && videoEl && (
                      <KonvaImage
                        image={videoEl}
                        x={screen.x}
                        y={screen.y}
                        width={screen.w}
                        height={screen.h}
                      />
                    )}

                    {/* Konva Empty State — animates with the device group. */}
                    {!hasMedia && !isExporting && (
                      <Group
                        x={screen.x + screen.w / 2}
                        y={screen.y + screen.h / 2 - 18}
                        listening={false}
                      >
                        {emptyHovered ? (
                          // ── Hover state: "Select Media" label ──
                          <>
                            {/* Icon bg */}
                            <Rect
                              x={-22} y={-22} width={44} height={44}
                              cornerRadius={12}
                              fill="rgba(255,255,255,0.13)"
                              stroke="rgba(255,255,255,0.2)"
                              strokeWidth={1}
                              listening={false}
                            />
                            {/* Image icon — simplified mountain/photo */}
                            <Rect x={-13} y={-14} width={28} height={22} cornerRadius={4} fill="rgba(255,255,255,0.7)" listening={false} />
                            <Shape
                              sceneFunc={(ctx, shape) => {
                                ctx.beginPath();
                                ctx.moveTo(-6, 4);
                                ctx.lineTo(0, -4);
                                ctx.lineTo(6, 2);
                                ctx.lineTo(8, -1);
                                ctx.lineTo(13, 6);
                                ctx.lineTo(-11, 6);
                                ctx.closePath();
                                ctx.fillStrokeShape(shape);
                              }}
                              fill="rgba(255,255,255,0.35)"
                              listening={false}
                            />
                            {/* Plus badge */}
                            <Rect x={4} y={-24} width={16} height={16} cornerRadius={8} fill="white" listening={false} />
                            <KonvaText text="+" x={4} y={-24} width={16} height={16} align="center" verticalAlign="middle" fontSize={13} fontStyle="bold" fill="#111" listening={false} />
                            {/* Select Media text */}
                            <KonvaText
                              text="Select Media"
                              x={-90} y={32}
                              width={180}
                              align="center"
                              fontSize={Math.max(11, screen.w * 0.042)}
                              fontStyle="600"
                              fill="white"
                              listening={false}
                            />
                            <KonvaText
                              text="Open Media Picker"
                              x={-90} y={32 + Math.max(11, screen.w * 0.042) + 6}
                              width={180}
                              align="center"
                              fontSize={Math.max(9, screen.w * 0.032)}
                              fill="rgba(255,255,255,0.4)"
                              listening={false}
                            />
                          </>
                        ) : (
                          // ── Idle state: "Drop or Paste" with photo+video icons ──
                          <>
                            {/* Photo icon (rounded rect) */}
                            <Rect x={-34} y={-22} width={36} height={28} cornerRadius={6} fill="rgba(255,255,255,0.18)" listening={false} />
                            <Shape
                              sceneFunc={(ctx, shape) => {
                                ctx.beginPath();
                                ctx.moveTo(-26, -2);
                                ctx.lineTo(-20, -10);
                                ctx.lineTo(-14, -4);
                                ctx.lineTo(-12, -7);
                                ctx.lineTo(-6, 0);
                                ctx.lineTo(-28, 0);
                                ctx.closePath();
                                ctx.fillStrokeShape(shape);
                              }}
                              fill="rgba(255,255,255,0.3)"
                              listening={false}
                            />
                            {/* Video camera icon (rect + triangle) */}
                            <Rect x={5} y={-20} width={28} height={22} cornerRadius={5} fill="rgba(255,255,255,0.18)" listening={false} />
                            <Shape
                              sceneFunc={(ctx, shape) => {
                                ctx.beginPath();
                                ctx.moveTo(33, -15);
                                ctx.lineTo(40, -9);
                                ctx.lineTo(33, -3);
                                ctx.closePath();
                                ctx.fillStrokeShape(shape);
                              }}
                              fill="rgba(255,255,255,0.18)"
                              listening={false}
                            />
                            {/* Plus badge */}
                            <Rect x={-6} y={-8} width={18} height={18} cornerRadius={9} fill="white" listening={false} />
                            <KonvaText text="+" x={-6} y={-8} width={18} height={18} align="center" verticalAlign="middle" fontSize={13} fontStyle="bold" fill="#111" listening={false} />
                            {/* Labels */}
                            <KonvaText
                              text="Drop or Paste"
                              x={-90} y={22}
                              width={180}
                              align="center"
                              fontSize={Math.max(11, screen.w * 0.042)}
                              fontStyle="600"
                              fill="rgba(255,255,255,0.82)"
                              listening={false}
                            />
                            <KonvaText
                              text="Images & Videos"
                              x={-90} y={22 + Math.max(11, screen.w * 0.042) + 6}
                              width={180}
                              align="center"
                              fontSize={Math.max(9, screen.w * 0.032)}
                              fill="rgba(255,255,255,0.38)"
                              listening={false}
                            />
                          </>
                        )}
                      </Group>
                    )}
                  </Group>

                  {/* iPhone frame image — always on top of video/image */}
                  {(device !== 'browser' && device !== 'macbook-pro' && device !== 'none') && (
                    <ImageDeviceFrame
                      device={device}
                      frameColor={frameColor}
                      deviceScale={deviceScale}
                    />
                  )}
                </Group>
              </Group>
            </Layer>

            {/* ── 3. Text Layer ─────────────────────────────────────────── */}
            <KonvaTextLayers
              textLayers={textLayers}
              currentTime={currentTime}
              stageWidth={stageSize.width}
              stageHeight={stageSize.height}
              activeTextLayerId={activeTextLayerId}
              setActiveTextLayerId={setActiveTextLayerId}
              setEditingTextLayerId={setEditingTextLayerId}
              updateTextLayer={updateTextLayer}
              isExporting={isExporting}
            />
          </Stage>

          {/* ── Media hover overlay (shots.so style) ──────────────────────── */}
          {hasMedia && !isExporting && (
            <div
              onMouseEnter={() => setMediaHovered(true)}
              onMouseLeave={() => setMediaHovered(false)}
              style={{
                position: "absolute",
                left: `${overlayLeft}%`,
                top: `${overlayTop}%`,
                width: `${overlayWidth}%`,
                height: `${overlayHeight}%`,
                borderRadius: screen.radius,
                pointerEvents: "auto",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s ease",
                background: mediaHovered ? "rgba(0,0,0,0.45)" : "transparent",
                backdropFilter: mediaHovered ? "blur(2px)" : "none",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onAddMediaClick) onAddMediaClick();
                else fileInputRef?.current?.click();
              }}
            >
              {mediaHovered && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <button
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8,
                      color: "white", fontSize: 12, fontWeight: 600, padding: "7px 14px", cursor: "pointer"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onAddMediaClick) onAddMediaClick();
                      else fileInputRef?.current?.click();
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Change {activeScene.mode === "video" ? "Video" : "Image"}
                  </button>
                  {onRemoveMedia && (
                    <button
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "rgba(239,68,68,0.15)", backdropFilter: "blur(12px)",
                        border: "1px solid rgba(239,68,68,0.35)", borderRadius: 8,
                        color: "#fca5a5", fontSize: 12, fontWeight: 600, padding: "7px 14px", cursor: "pointer"
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveMedia();
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          )}


          {/* ── Empty state: smooth hover overlay + click-based inline picker ── */}
          {!hasMedia && !isExporting && (
            <>
              {/* Inline Media Picker panel — fixed to viewport so it ignores CSS 3D camera transforms */}
              {pickerOpen && pickerAnchor && (
                <div
                  ref={pickerRef}
                  style={{
                    position: 'fixed',
                    left: pickerAnchor.x,
                    top: pickerAnchor.top,
                    transform: 'translate(-50%, calc(-100% - 18px))',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    animation: 'fadeInUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                    pointerEvents: 'auto',
                  }}
                >
                  <span style={{
                    fontSize: 13, fontWeight: 500,
                    color: 'rgba(255,255,255,0.75)',
                    letterSpacing: '-0.01em',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  }}>Media Picker</span>

                  {/* Horizontal scrollable media strip */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    gap: 8,
                    background: 'rgba(18,18,22,0.92)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    padding: '10px 12px',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
                    maxWidth: 360,
                    overflowX: 'auto',
                  }}>
                    {/* Existing media thumbnails */}
                    {mediaLibrary.map(asset => (
                      <div
                        key={asset.id}
                        title={asset.name}
                        style={{
                          width: 60,
                          aspectRatio: '9/16',
                          borderRadius: 10,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: '1.5px solid rgba(255,255,255,0.08)',
                          flexShrink: 0,
                          background: '#111',
                          transition: 'border-color 0.15s, transform 0.15s',
                          position: 'relative',
                        }}
                        onClick={() => { onSelectMedia?.(asset); setPickerOpen(false); }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,85,247,0.6)';
                          (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                        }}
                      >
                        {asset.type === 'image'
                          ? <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <video src={asset.url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} muted />
                        }
                        {/* Delete btn */}
                        <button
                          style={{
                            position: 'absolute', top: 4, right: 4,
                            width: 18, height: 18, borderRadius: 5,
                            background: 'rgba(239,68,68,0.85)',
                            border: 'none', color: 'white', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 800, lineHeight: 1,
                            opacity: 0, transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
                          onClick={e => { e.stopPropagation(); onDeleteMedia?.(asset.id); }}
                        >×</button>
                      </div>
                    ))}

                    {/* Add new media button */}
                    <button
                      style={{
                        width: 60,
                        aspectRatio: '9/16',
                        borderRadius: 10,
                        border: '1.5px dashed rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        color: 'rgba(255,255,255,0.5)',
                        flexShrink: 0,
                        transition: 'border-color 0.15s, background 0.15s, color 0.15s',
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = 'rgba(168,85,247,0.5)';
                        el.style.background = 'rgba(168,85,247,0.08)';
                        el.style.color = 'rgba(168,85,247,0.9)';
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = 'rgba(255,255,255,0.2)';
                        el.style.background = 'rgba(255,255,255,0.04)';
                        el.style.color = 'rgba(255,255,255,0.5)';
                      }}
                      onClick={() => {
                        activeScene.mode === 'video'
                          ? videoFileInputRef?.current?.click()
                          : fileInputRef?.current?.click();
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Transparent click area over the phone screen — with smooth CSS hover transition */}
              <div
                style={{
                  position: 'absolute',
                  left: `${overlayLeft}%`,
                  top: `${overlayTop}%`,
                  width: `${overlayWidth}%`,
                  height: `${overlayHeight}%`,
                  cursor: 'pointer',
                  borderRadius: `${screen.radius}px`,
                  zIndex: 15,
                  // Smooth background highlight on hover
                  background: emptyHovered && !pickerOpen ? 'rgba(255,255,255,0.045)' : 'transparent',
                  transition: 'background 0.45s ease',
                }}
                onMouseEnter={() => setEmptyHovered(true)}
                onMouseLeave={() => setEmptyHovered(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  setPickerOpen(prev => !prev);
                }}
              />
            </>
          )}


        </div>
      </div>
    </>
  );
});

export default KonvaStage;
