'use client';

import {
  useState, useRef, useCallback, useEffect,
  type CSSProperties, type DragEvent, type ChangeEvent,
} from 'react';
import { ToolLayout, SplitPanel } from '@/components/ui/ToolLayout';
import { Download, Monitor, Crop, Maximize2, Smartphone, Type, AlignLeft, AlignCenter, AlignRight, Trash2, Plus, RotateCcw, Layers, Image as ImageIcon } from 'lucide-react';
import { exportElementToPNG } from '@/lib/exporters';
import { useToastStore } from '@/lib/toast';
import { DeviceFrame, type DeviceModel, type FrameColor, type BrowserVariant } from '@/components/mockup/DeviceFrame';
import { DeviceSelector } from '@/components/mockup/DeviceSelector';
import s from './page.module.css';

/* ══════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════ */
type ExportMode = 'full' | 'device' | 'tight';

export interface TextLayer {
  id: string;
  type: 'title' | 'subtitle' | 'caption' | 'badge';
  text: string;

  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;

  fontFamily: string;
  fontPreset: string;

  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;

  color: string;
  opacity: number;
  align: 'left' | 'center' | 'right';

  glow: number;
  blur?: number;

  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;

  shadow?: boolean;
  locked?: boolean;
  hidden?: boolean;
  zIndex: number;
}
export const FONT_PRESETS = [
  { id: 'modern', label: 'Modern', font: 'Inter, sans-serif', preview: 'Aa' },
  { id: 'cinematic', label: 'Cinematic', font: '"Bebas Neue", sans-serif', preview: 'Aa' },
  { id: 'luxury', label: 'Luxury', font: '"Cormorant Garamond", serif', preview: 'Aa' },
  { id: 'apple', label: 'Apple', font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', preview: 'Aa' },
  { id: 'editorial', label: 'Editorial', font: '"General Sans", Georgia, serif', preview: 'Aa' },
  { id: 'mono', label: 'Mono', font: '"JetBrains Mono", ui-monospace, monospace', preview: 'Aa' },
];

const TEXT_BLOCKS: { id: string; label: string; text: string; type: TextLayer['type']; fontSize: number; fontWeight: number; letterSpacing: number; lineHeight: number; color: string; gradient?: boolean }[] = [
  { id: 'hero', label: 'Hero Title', text: 'The Future of\nProduct Design', type: 'title', fontSize: 64, fontWeight: 800, letterSpacing: -2, lineHeight: 1.0, color: '#ffffff', gradient: false },
  { id: 'launch', label: 'Launch', text: 'Introducing ScreenForge 2.0', type: 'title', fontSize: 42, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.05, color: '#ffffff', gradient: true },
  { id: 'feature', label: 'Feature', text: 'Powerful timeline editor', type: 'subtitle', fontSize: 28, fontWeight: 600, letterSpacing: -0.5, lineHeight: 1.2, color: '#e4e4e7', gradient: false },
  { id: 'subtitle', label: 'Subtitle', text: 'Built for modern product teams', type: 'subtitle', fontSize: 22, fontWeight: 400, letterSpacing: 0, lineHeight: 1.4, color: '#a1a1aa', gradient: false },
  { id: 'cta', label: 'CTA', text: 'Start for free →', type: 'badge', fontSize: 14, fontWeight: 700, letterSpacing: 0.5, lineHeight: 1.4, color: '#c084fc', gradient: false },
  { id: 'caption', label: 'Caption', text: 'Available on iOS & Android', type: 'caption', fontSize: 13, fontWeight: 400, letterSpacing: 0.3, lineHeight: 1.6, color: '#71717a', gradient: false },
];

interface BgOption {
  id: string;
  label: string;
  style: CSSProperties;
  /** CSS string for the thumbnail swatch */
  thumb: string;
}

interface BgCategory {
  label: string;
  items: BgOption[];
}

/* ══════════════════════════════════════════════
   BACKGROUND CATALOGUE
   All pure CSS — no image URLs needed.
   Add real image URLs to thumb/style as desired.
══════════════════════════════════════════════ */
const BG_CATEGORIES: BgCategory[] = [
  {
    label: 'Cosmic',
    items: [
      { id: 'cosmic-1', label: 'Aurora', thumb: 'linear-gradient(135deg,#6d28d9,#4f46e5,#0ea5e9)', style: { background: 'linear-gradient(135deg,#6d28d9 0%,#4f46e5 50%,#0ea5e9 100%)' } },
      { id: 'cosmic-2', label: 'Nebula', thumb: 'linear-gradient(135deg,#7c3aed,#db2777)', style: { background: 'linear-gradient(135deg,#7c3aed,#db2777)' } },
      { id: 'cosmic-3', label: 'Midnight', thumb: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)', style: { background: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)' } },
      { id: 'cosmic-4', label: 'Void', thumb: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)', style: { background: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)' } },
    ],
  },
  {
    label: 'Mystic',
    items: [
      { id: 'mystic-1', label: 'Soft', thumb: 'linear-gradient(135deg,#e0e7ff,#c7d2fe,#ddd6fe)', style: { background: 'linear-gradient(135deg,#e0e7ff,#c7d2fe,#ddd6fe)' } },
      { id: 'mystic-2', label: 'Lavender', thumb: 'linear-gradient(135deg,#ede9fe,#c4b5fd,#a78bfa)', style: { background: 'linear-gradient(135deg,#ede9fe,#c4b5fd,#a78bfa)' } },
      { id: 'mystic-3', label: 'Haze', thumb: 'linear-gradient(135deg,#f0f9ff,#bae6fd,#7dd3fc)', style: { background: 'linear-gradient(135deg,#f0f9ff,#bae6fd,#7dd3fc)' } },
      { id: 'mystic-4', label: 'Rose', thumb: 'linear-gradient(135deg,#fff1f2,#fecdd3,#fda4af)', style: { background: 'linear-gradient(135deg,#fff1f2,#fecdd3,#fda4af)' } },
    ],
  },
  {
    label: 'Abstract',
    items: [
      { id: 'abs-1', label: 'Ember', thumb: 'linear-gradient(135deg,#dc2626,#ea580c,#ca8a04)', style: { background: 'linear-gradient(135deg,#dc2626,#ea580c,#ca8a04)' } },
      { id: 'abs-2', label: 'Forest', thumb: 'linear-gradient(135deg,#065f46,#059669,#34d399)', style: { background: 'linear-gradient(135deg,#065f46,#059669,#34d399)' } },
      { id: 'abs-3', label: 'Ocean', thumb: 'linear-gradient(135deg,#0c4a6e,#0284c7,#38bdf8)', style: { background: 'linear-gradient(135deg,#0c4a6e,#0284c7,#38bdf8)' } },
      { id: 'abs-4', label: 'Slate', thumb: 'linear-gradient(135deg,#1e293b,#334155,#475569)', style: { background: 'linear-gradient(135deg,#1e293b,#334155,#475569)' } },
    ],
  },
  {
    label: 'Radiant',
    items: [
      { id: 'rad-1', label: 'Solar', thumb: 'radial-gradient(ellipse at 30% 30%,#fde68a,#f59e0b,#b45309)', style: { background: 'radial-gradient(ellipse at 30% 30%,#fde68a,#f59e0b,#b45309)' } },
      { id: 'rad-2', label: 'Glow', thumb: 'radial-gradient(ellipse at 50% 50%,#a78bfa,#7c3aed,#1e1b4b)', style: { background: 'radial-gradient(ellipse at 50% 50%,#a78bfa,#7c3aed,#1e1b4b)' } },
      { id: 'rad-3', label: 'Frost', thumb: 'radial-gradient(ellipse at 70% 30%,#e0f2fe,#bae6fd,#0284c7)', style: { background: 'radial-gradient(ellipse at 70% 30%,#e0f2fe,#bae6fd,#0284c7)' } },
      { id: 'rad-4', label: 'Carbon', thumb: 'radial-gradient(ellipse at 50% 0%,#27272a,#09090b)', style: { background: 'radial-gradient(ellipse at 50% 0%,#27272a,#09090b)' } },
    ],
  },
  {
    label: 'Dark',
    items: [
      { id: 'dark-1', label: 'Pure', thumb: '#09090b', style: { background: '#09090b' } },
      { id: 'dark-2', label: 'Zinc', thumb: 'linear-gradient(180deg,#18181b,#09090b)', style: { background: 'linear-gradient(180deg,#18181b,#09090b)' } },
      { id: 'dark-3', label: 'Indigo', thumb: 'linear-gradient(135deg,#1e1b4b,#0f0c29)', style: { background: 'linear-gradient(135deg,#1e1b4b,#0f0c29)' } },
      { id: 'dark-4', label: 'Green', thumb: 'linear-gradient(135deg,#052e16,#14532d)', style: { background: 'linear-gradient(135deg,#052e16,#14532d)' } },
    ],
  },
];

const DEFAULT_BG = BG_CATEGORIES[0].items[0];

/* ══════════════════════════════════════════════
   LAYOUT PRESETS
   Control zoom (scale) and X/Y position of the
   device inside the fixed canvas.
   rotateX/Y stay subtle (max ±10°).
══════════════════════════════════════════════ */
interface LayoutPreset {
  id: string;
  label: string;
  zoom: number;     // 40–150, treated as scale%
  posX: number;     // -50 to 50, % of canvas width
  posY: number;     // -50 to 50, % of canvas height
  tiltX: number;
  tiltY: number;
  shadow: number;
  bgId: string;
}

const LAYOUT_PRESETS: LayoutPreset[] = [
  { id: 'centered', label: 'Centered', zoom: 72, posX: 0, posY: 0, tiltX: 0, tiltY: 0, shadow: 40, bgId: 'cosmic-1' },
  { id: 'hero', label: 'Hero', zoom: 88, posX: 0, posY: 6, tiltX: 0, tiltY: 0, shadow: 55, bgId: 'cosmic-2' },
  { id: 'corner', label: 'Corner', zoom: 78, posX: -18, posY: 12, tiltX: 4, tiltY: 8, shadow: 60, bgId: 'abs-1' },
  { id: 'floating', label: 'Floating', zoom: 68, posX: 0, posY: -8, tiltX: 6, tiltY: 0, shadow: 80, bgId: 'rad-2' },
  { id: 'minimal', label: 'Minimal', zoom: 60, posX: 0, posY: 0, tiltX: 0, tiltY: 0, shadow: 18, bgId: 'dark-1' },
  { id: 'dramatic', label: 'Dramatic', zoom: 74, posX: 10, posY: 5, tiltX: 8, tiltY: -10, shadow: 72, bgId: 'cosmic-3' },
  { id: 'showcase', label: 'Showcase', zoom: 78, posX: 16, posY: 0, tiltX: 4, tiltY: -8, shadow: 62, bgId: 'cosmic-1' },
  { id: 'split', label: 'Split', zoom: 66, posX: 0, posY: 0, tiltX: 0, tiltY: 0, shadow: 48, bgId: 'abs-3' },
];

/* SVG diagrams for preset thumbnails */
const PresetDiagram = ({ id }: { id: string }) => {
  const ph = '#a855f7'; // purple highlight
  const dim = '#3f3f46';
  const phone = (x: number, y: number, w: number, h: number, opacity = 1) => (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx="2" fill="none" stroke={ph} strokeWidth="1.2" />
      <rect x={x + w * 0.3} y={y - 0.8} width={w * 0.4} height="1.5" rx="0.75" fill={dim} />
    </g>
  );

  const diagrams: Record<string, React.ReactNode> = {
    centered: <>{phone(17, 8, 14, 22)}</>,
    hero: <>{phone(13, 4, 22, 34)}</>,
    corner: <>{phone(4, 14, 14, 22)}</>,
    floating: <>{phone(17, 6, 14, 22)}<rect x="10" y="30" width="28" height="2" rx="1" fill={ph} opacity=".25" /></>,
    minimal: <>{phone(19, 12, 10, 16)}</>,
    dramatic: <g transform="rotate(-6 24 24)">{phone(15, 8, 14, 22)}</g>,
    showcase: <>{phone(20, 8, 13, 21)}{phone(10, 12, 11, 18, 0.4)}</>,
    split: <>{phone(7, 10, 12, 20)}{phone(23, 10, 12, 20)}</>,
  };

  return (
    <svg viewBox="0 0 48 44" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%' }}>
      <rect width="48" height="44" fill="rgba(255,255,255,0.03)" />
      {diagrams[id] ?? diagrams.centered}
    </svg>
  );
};

/* ══════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════ */
const FRAME_COLORS: { value: FrameColor; label: string; color: string }[] = [
  { value: 'spaceBlack', label: 'Space Black', color: '#151516' },
  { value: 'spaceGray', label: 'Space Gray', color: '#53565a' },
  { value: 'silver', label: 'Silver', color: '#e5e7eb' },
  { value: 'midnight', label: 'Midnight', color: '#1e293b' },
  { value: 'starlight', label: 'Starlight', color: '#e2dcd0' },
  { value: 'naturalTitanium', label: 'Natural Titanium', color: '#a8a297' },
  { value: 'titaniumBlue', label: 'Titanium Blue', color: '#374754' },
  { value: 'gold', label: 'Gold', color: '#e5c199' },
];

const EXPORT_MODES: { id: ExportMode; label: string; icon: React.ReactNode }[] = [
  { id: 'full', label: 'Full Canvas', icon: <Maximize2 size={11} /> },
  { id: 'device', label: 'Device Only', icon: <Smartphone size={11} /> },
  { id: 'tight', label: 'Tight Crop', icon: <Crop size={11} /> },
];

/* ══════════════════════════════════════════════
   UPLOAD PLACEHOLDER
══════════════════════════════════════════════ */
const UploadPlaceholder = () => (
  <div className={s.shotsPlaceholder}>
    <div className={s.mediaStack}>
      <svg className={s.mediaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
      <div className={s.plusCircle}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
          style={{ width: 9, height: 9, color: '#000' }}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
    </div>
    <div className={s.placeholderText}>Drop or Paste</div>
    <div className={s.placeholderSubtext}>Images & Videos</div>
  </div>
);

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function MockupStudioPage() {

  /* Images */
  const [image, setImage] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [imageAspect, setImageAspect] = useState<number | null>(null);

  useEffect(() => {
    if (!image) {
      setImageAspect(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (img.width && img.height) {
        setImageAspect(img.width / img.height);
      }
    };
    img.src = image;
  }, [image]);

  const [activeSlot, setActiveSlot] = useState<1 | 2>(1);

  /* Device */
  const [device, setDevice] = useState<DeviceModel>('iphone-17-pro');
  const [frameColor, setFrameColor] = useState<FrameColor>('spaceBlack');
  const [screens, setScreens] = useState<1 | 2>(1);
  const [dualLayout, setDualLayout] = useState<'offset' | 'side' | 'angled-out' | 'angled-in' | 'stack' | 'overlap'>('offset');

  /* Camera — zoom + position + tilt */
  const [activePreset, setActivePreset] = useState<string | null>('centered');
  const [zoom, setZoom] = useState(72);
  const [posX, setPosX] = useState(0);   // percent of canvas width
  const [posY, setPosY] = useState(0);   // percent of canvas height
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [shadow, setShadow] = useState(40);

  /* Camera UI */
  const [cameraTab, setCameraTab] = useState<'zoom' | 'tilt'>('zoom');
  const [precision, setPrecision] = useState(false);
  const isDraggingZoomRef = useRef(false);

  /* Background */
  const [bg, setBg] = useState<BgOption>(DEFAULT_BG);

  /* Text Layers */
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [canvasFormat, setCanvasFormat] = useState<'16:9' | '9:16' | '1:1' | '4:3' | '5:3'>('16:9');

  /* Browser specific */
  const [browserVariant, setBrowserVariant] = useState<BrowserVariant>('safari-light');
  const [browserScale, setBrowserScale] = useState(100);
  const [browserUrl, setBrowserUrl] = useState('');

  /* Export */
  const [exportRes, setExportRes] = useState<'1' | '2' | '3'>('2');
  const [exportMode, setExportMode] = useState<ExportMode>('full');
  const [showExport, setShowExport] = useState(false);

  const canvasBgRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [canvasDim, setCanvasDim] = useState({ w: 800, h: 450 });
  
  useEffect(() => {
    if (!canvasBgRef.current) return;
    const ob = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasDim({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    ob.observe(canvasBgRef.current);
    return () => ob.disconnect();
  }, []);

  const resizeLayerRef = useRef<string | null>(null);
  const resizeStartRef = useRef<{ mx: number; w: number } | null>(null);
  const { addToast } = useToastStore();

  /* ── Find bg by id ── */
  const findBg = (id: string): BgOption => {
    for (const cat of BG_CATEGORIES) {
      const found = cat.items.find(i => i.id === id);
      if (found) return found;
    }
    return DEFAULT_BG;
  };

  const isLoaded = useRef(false);

  // On Mount: Load settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mockup_studio_settings');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.image) setImage(data.image);
        if (data.image2) setImage2(data.image2);
        if (data.device) setDevice(data.device);
        if (data.frameColor) setFrameColor(data.frameColor);
        if (data.screens) setScreens(data.screens);
        if (data.dualLayout) setDualLayout(data.dualLayout);
        if (data.activePreset !== undefined) setActivePreset(data.activePreset);
        if (data.zoom !== undefined) setZoom(data.zoom);
        if (data.posX !== undefined) setPosX(data.posX);
        if (data.posY !== undefined) setPosY(data.posY);
        if (data.tiltX !== undefined) setTiltX(data.tiltX);
        if (data.tiltY !== undefined) setTiltY(data.tiltY);
        if (data.shadow !== undefined) setShadow(data.shadow);
        if (data.bg) {
          const bgId = typeof data.bg === 'string' ? data.bg : data.bg.id;
          setBg(findBg(bgId));
        }
        if (data.textLayers) setTextLayers(data.textLayers);
        if (data.canvasFormat) setCanvasFormat(data.canvasFormat);
        if (data.browserVariant) setBrowserVariant(data.browserVariant);
        if (data.browserScale !== undefined) setBrowserScale(data.browserScale);
        if (data.browserUrl !== undefined) setBrowserUrl(data.browserUrl);
        if (data.exportRes) setExportRes(data.exportRes);
        if (data.exportMode) setExportMode(data.exportMode);
      }
    } catch (err) {
      console.error('Error loading settings from localStorage', err);
    } finally {
      // Small timeout to ensure state updates have flushed before allowing saves
      setTimeout(() => {
        isLoaded.current = true;
      }, 100);
    }
  }, []);

  // Save settings whenever any configuration state changes
  useEffect(() => {
    if (!isLoaded.current) return;
    
    try {
      const settings = {
        image,
        image2,
        device,
        frameColor,
        screens,
        dualLayout,
        activePreset,
        zoom,
        posX,
        posY,
        tiltX,
        tiltY,
        shadow,
        bg,
        textLayers,
        canvasFormat,
        browserVariant,
        browserScale,
        browserUrl,
        exportRes,
        exportMode
      };
      localStorage.setItem('mockup_studio_settings', JSON.stringify(settings));
    } catch (err) {
      // If we exceed quota (e.g. because image data URL is too large), try to save without images!
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        try {
          const settingsWithoutImages = {
            device,
            frameColor,
            screens,
            dualLayout,
            activePreset,
            zoom,
            posX,
            posY,
            tiltX,
            tiltY,
            shadow,
            bg,
            textLayers,
            canvasFormat,
            browserVariant,
            browserScale,
            browserUrl,
            exportRes,
            exportMode
          };
          localStorage.setItem('mockup_studio_settings', JSON.stringify(settingsWithoutImages));
        } catch (innerErr) {
          console.error('Failed to save settings even without images', innerErr);
        }
      } else {
        console.error('Error saving settings to localStorage', err);
      }
    }
  }, [
    image, image2, device, frameColor, screens, dualLayout, activePreset,
    zoom, posX, posY, tiltX, tiltY, shadow, bg, textLayers, canvasFormat,
    browserVariant, browserScale, browserUrl, exportRes, exportMode
  ]);

  /* ── Apply layout preset ── */
  const applyPreset = useCallback((preset: LayoutPreset) => {
    setActivePreset(preset.id);
    setZoom(preset.zoom);
    setPosX(preset.posX);
    setPosY(preset.posY);
    setTiltX(preset.tiltX);
    setTiltY(preset.tiltY);
    setShadow(preset.shadow);
    setBg(findBg(preset.bgId));
    if (preset.id === 'split') setScreens(2);
  }, []);

  /* ── Text Layers ── */
  const [showTextBlockMenu, setShowTextBlockMenu] = useState(false);
  const textMenuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (textMenuContainerRef.current && !textMenuContainerRef.current.contains(event.target as Node)) {
        setShowTextBlockMenu(false);
      }
    }
    if (showTextBlockMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTextBlockMenu]);

  const addTextBlock = (block: typeof TEXT_BLOCKS[0]) => {
    const id = `text-${Date.now()}`;
    const newLayer: TextLayer = {
      id,
      type: block.type,
      text: block.text,
      x: 0,
      y: -25, // slightly above center
      width: 700,
      align: 'center',
      fontFamily: FONT_PRESETS[0].font,
      fontPreset: 'modern',
      fontSize: block.fontSize,
      fontWeight: block.fontWeight,
      letterSpacing: block.letterSpacing,
      lineHeight: block.lineHeight,
      color: block.color,
      opacity: 1,
      glow: 0,
      gradient: block.gradient ?? false,
      gradientFrom: '#a855f7',
      gradientTo: '#6366f1',
      shadow: false,
      zIndex: textLayers.length + 1,
    };
    setTextLayers(prev => [...prev, newLayer]);
    setActiveLayerId(id);
    setShowTextBlockMenu(false);
  };

  const updateTextLayer = (id: string, updates: Partial<TextLayer>) => {
    setTextLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteTextLayer = (id: string) => {
    setTextLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) setActiveLayerId(null);
  };

  const draggingLayerRef = useRef<string | null>(null);
  const dragStartRef = useRef<{ mx: number; my: number; sx: number; sy: number } | null>(null);
  const [snapGuides, setSnapGuides] = useState<{ h: boolean; v: boolean }>({ h: false, v: false });

  const handleTextLayerPointerDown = (e: React.PointerEvent, id: string) => {
    if (exportMode === 'device' || exportMode === 'tight') return;
    e.stopPropagation();
    setActiveLayerId(id);
    const canvasEl = canvasBgRef.current;
    if (!canvasEl) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingLayerRef.current = id;
    const layer = textLayers.find(l => l.id === id);
    if (!layer) return;
    dragStartRef.current = { mx: e.clientX, my: e.clientY, sx: layer.x, sy: layer.y };
  };

  const SNAP_THRESHOLD = 2; // percent

  const handleTextLayerPointerMove = (e: React.PointerEvent) => {
    if (!draggingLayerRef.current || !dragStartRef.current) return;
    const canvasEl = canvasBgRef.current;
    if (!canvasEl) return;

    const dx = e.clientX - dragStartRef.current.mx;
    const dy = e.clientY - dragStartRef.current.my;
    const pctX = (dx / canvasEl.offsetWidth) * 100;
    const pctY = (dy / canvasEl.offsetHeight) * 100;

    let newX = dragStartRef.current.sx + pctX;
    let newY = dragStartRef.current.sy + pctY;

    // Magnetic snapping to center
    const snapH = Math.abs(newX) < SNAP_THRESHOLD;
    const snapV = Math.abs(newY) < SNAP_THRESHOLD;
    if (snapH) newX = 0;
    if (snapV) newY = 0;
    setSnapGuides({ h: snapV, v: snapH });

    newX = Math.max(-80, Math.min(80, newX));
    newY = Math.max(-80, Math.min(80, newY));

    updateTextLayer(draggingLayerRef.current, { x: newX, y: newY });
  };

  const handleTextLayerPointerUp = (e: React.PointerEvent) => {
    if (draggingLayerRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      draggingLayerRef.current = null;
      dragStartRef.current = null;
      setSnapGuides({ h: false, v: false });
    }
  };

  /* ── Beautify ── */
  const handleBeautify = useCallback(() => {
    applyPreset(LAYOUT_PRESETS.find(p => p.id === 'floating')!);
    addToast('Composition optimized', 'success');
  }, [applyPreset, addToast]);

  /* ── Export ── */
  const handleExport = useCallback(async () => {
    const target =
      exportMode === 'device' ? deviceRef.current :
        exportMode === 'tight' ? deviceRef.current :
          canvasBgRef.current;
    if (!target) return;
    addToast('Generating...', 'info');
    try {
      await exportElementToPNG(target, `mockup-${Date.now()}.png`, Number(exportRes));
      addToast('Exported!', 'success');
    } catch {
      addToast('Export failed', 'error');
    }
  }, [exportMode, exportRes, addToast]);

  /* ── File handling ── */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const r = ev.target?.result as string;
      if (activeSlot === 1) setImage(r); else setImage2(r);
      addToast('Image loaded', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent) => e.preventDefault();

  const handleDrop = (e: DragEvent, slot: 1 | 2) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => {
        const r = ev.target?.result as string;
        if (slot === 1) setImage(r); else setImage2(r);
        addToast('Image loaded', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  /* ── Deactivate preset on manual input ── */
  const manual = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setActivePreset(null);
  };

  /* ── Device transform ── */
  // The wrapper sits at canvas center (top:50% left:50%), width/height auto.
  // translate(-50%,-50%) centers on the device's own bounding box.
  // posX/posY (-45..+45) map to ±30% of the canvas via a CSS var we inject.
  const canvasW = canvasDim.w;
  const canvasH = canvasDim.h;
  const BASE_WIDTH = 800; // Original default width
  const dynamicScale = canvasW / BASE_WIDTH;
  
  const formatRatios: Record<string, string> = {
    '16:9': '16/9',
    '9:16': '9/16',
    '1:1': '1/1',
    '4:3': '4/3',
    '5:3': '5/3',
  };

  const pxX = (posX / 100) * canvasW;
  const pxY = (posY / 100) * canvasH;

  const deviceStyle: CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 'auto',
    height: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transformOrigin: 'center center',
    transform: [
      `translate(calc(-50% + ${pxX}px), calc(-50% + ${pxY}px))`,
      `scale(${(zoom / 100) * dynamicScale})`,
      `rotateX(${tiltX}deg)`,
      `rotateY(${tiltY}deg)`,
    ].join(' '),
    transition: 'transform 0.38s cubic-bezier(0.4,0,0.2,1)',
    transformStyle: 'preserve-3d',
  };

  /* ═══════════════════════════════════════
     INSPECTOR
  ═══════════════════════════════════════ */
  const inspector = (
    <div className={s.controlsContainer}>
      <input type="file" accept="image/*" ref={fileInputRef}
        onChange={handleFileChange} style={{ display: 'none' }} />

      {/* Text Layers */}
      <div className={s.section}>
        {/* Header */}
        <div className={s.sectionLabel} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={s.sectionLabelDot} />
            Text Layers
            {textLayers.length > 0 && (
              <span style={{ background: 'rgba(168,85,247,0.2)', color: '#c084fc', borderRadius: 99, padding: '1px 6px', fontSize: '0.5rem', fontWeight: 700 }}>{textLayers.length}</span>
            )}
          </div>
          <div ref={textMenuContainerRef} style={{ position: 'relative' }}>
            <button className={s.addTextBtn} onClick={() => setShowTextBlockMenu(v => !v)}>
              <Plus size={10} style={{ display: 'inline', marginRight: 2 }} />
              Add Text
            </button>
            {showTextBlockMenu && (
              <div className={s.textBlockMenu}>
                <div className={s.textBlockMenuTitle}>TEXT BLOCKS</div>
                {TEXT_BLOCKS.map(block => (
                  <button key={block.id} className={s.textBlockMenuItem} onClick={() => addTextBlock(block)}>
                    <div className={s.textBlockPreview} style={{ fontWeight: block.fontWeight, fontSize: Math.max(10, block.fontSize * 0.18), letterSpacing: block.letterSpacing * 0.3 }}>{block.text.split('\n')[0]}</div>
                    <div className={s.textBlockLabel}>{block.label}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Layer pills */}
        {textLayers.length > 0 && (
          <div className={s.textLayersList}>
            {textLayers.map((layer, i) => (
              <button
                key={layer.id}
                className={`${s.textLayerPill} ${activeLayerId === layer.id ? s.textLayerPillActive : ''}`}
                onClick={() => setActiveLayerId(activeLayerId === layer.id ? null : layer.id)}
              >
                <Type size={9} />
                <span style={{ maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{layer.text.split('\n')[0]}</span>
                {layer.hidden && <span style={{ opacity: 0.4, fontSize: '0.5rem' }}>hidden</span>}
              </button>
            ))}
          </div>
        )}

        {/* Active layer editor */}
        {activeLayerId && (() => {
          const al = textLayers.find(l => l.id === activeLayerId);
          if (!al) return null;
          return (
            <div className={s.textEditorCard}>
              {/* Top bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{al.type}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className={s.textDeleteBtn} title="Duplicate" onClick={() => {
                    const id = `text-${Date.now()}`;
                    setTextLayers(prev => [...prev, { ...al, id, x: al.x + 2, y: al.y + 2, zIndex: prev.length + 1 }]);
                    setActiveLayerId(id);
                  }}><Layers size={11} /></button>
                  <button className={s.textDeleteBtn} onClick={() => deleteTextLayer(al.id)}><Trash2 size={11} /></button>
                </div>
              </div>

              {/* Text content */}
              <textarea
                className={s.textInput}
                value={al.text}
                onChange={e => updateTextLayer(al.id, { text: e.target.value })}
                placeholder="Your text..."
                rows={3}
              />

              {/* ── FONT PRESET ── */}
              <div className={s.textSectionLabel}>FONT</div>
              <div className={s.fontPresetGrid}>
                {FONT_PRESETS.map(fp => (
                  <button
                    key={fp.id}
                    className={`${s.fontPresetBtn} ${al.fontPreset === fp.id ? s.fontPresetBtnActive : ''}`}
                    onClick={() => updateTextLayer(al.id, { fontPreset: fp.id, fontFamily: fp.font })}
                    style={{ fontFamily: fp.font }}
                  >
                    <span className={s.fontPreviewChar}>{fp.preview}</span>
                    <span className={s.fontPreviewLabel}>{fp.label}</span>
                  </button>
                ))}
              </div>

              {/* ── TEXT STYLE ── */}
              <div className={s.textSectionLabel}>TEXT STYLE</div>
              <div className={s.textPropertiesGrid}>
                <div className={s.cameraRow}>
                  <div className={s.sliderMeta}>
                    <span className={s.sliderName}>Size</span>
                    <span className={s.sliderVal}>{al.fontSize}px</span>
                  </div>
                  <input type="range" className={s.slider} min={10} max={140} value={al.fontSize} onChange={e => updateTextLayer(al.id, { fontSize: +e.target.value })} />
                </div>
                <div className={s.cameraRow}>
                  <div className={s.sliderMeta}>
                    <span className={s.sliderName}>Weight</span>
                    <span className={s.sliderVal}>{al.fontWeight}</span>
                  </div>
                  <input type="range" className={s.slider} min={100} max={900} step={100} value={al.fontWeight} onChange={e => updateTextLayer(al.id, { fontWeight: +e.target.value })} />
                </div>
                <div className={s.cameraRow}>
                  <div className={s.sliderMeta}>
                    <span className={s.sliderName}>Spacing</span>
                    <span className={s.sliderVal}>{al.letterSpacing}px</span>
                  </div>
                  <input type="range" className={s.slider} min={-5} max={10} step={0.5} value={al.letterSpacing} onChange={e => updateTextLayer(al.id, { letterSpacing: +e.target.value })} />
                </div>
                <div className={s.cameraRow}>
                  <div className={s.sliderMeta}>
                    <span className={s.sliderName}>Line Height</span>
                    <span className={s.sliderVal}>{al.lineHeight}</span>
                  </div>
                  <input type="range" className={s.slider} min={0.7} max={2.5} step={0.05} value={al.lineHeight} onChange={e => updateTextLayer(al.id, { lineHeight: +e.target.value })} />
                </div>
                {/* Align */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['left', 'center', 'right'] as const).map(a => (
                    <button key={a} style={{ flex: 1, padding: '4px 0', borderRadius: 5, border: 'none', cursor: 'pointer', background: al.align === a ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.04)', color: al.align === a ? '#d8b4fe' : '#52525b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => updateTextLayer(al.id, { align: a })}>
                      {a === 'left' ? <AlignLeft size={11} /> : a === 'center' ? <AlignCenter size={11} /> : <AlignRight size={11} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── APPEARANCE ── */}
              <div className={s.textSectionLabel}>APPEARANCE</div>
              <div className={s.textPropertiesGrid}>
                {/* Color swatch row */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { val: '#ffffff', label: 'White' },
                    { val: '#a1a1aa', label: 'Gray' },
                    { val: '#c084fc', label: 'Purple' },
                    { val: '#38bdf8', label: 'Cyan' },
                    { val: '#34d399', label: 'Mint' },
                  ].map(c => (
                    <button key={c.val}
                      title={c.label}
                      onClick={() => updateTextLayer(al.id, { color: c.val, gradient: false })}
                      style={{ width: 18, height: 18, borderRadius: '50%', background: c.val, border: al.color === c.val && !al.gradient ? '2px solid #a855f7' : '2px solid transparent', cursor: 'pointer', boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }}
                    />
                  ))}
                  {/* Gradient toggle */}
                  <button
                    onClick={() => updateTextLayer(al.id, { gradient: !al.gradient })}
                    style={{ height: 18, padding: '0 7px', borderRadius: 99, background: al.gradient ? 'linear-gradient(135deg,#a855f7,#6366f1)' : 'rgba(255,255,255,0.06)', border: al.gradient ? 'none' : '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: '0.55rem', fontWeight: 700, color: al.gradient ? '#fff' : '#71717a' }}
                  >Grad</button>
                </div>
                {/* Gradient colors if enabled */}
                {al.gradient && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input type="color" value={al.gradientFrom ?? '#a855f7'} onChange={e => updateTextLayer(al.id, { gradientFrom: e.target.value })} style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4, padding: 0 }} />
                    <span style={{ fontSize: '0.55rem', color: '#52525b' }}>→</span>
                    <input type="color" value={al.gradientTo ?? '#6366f1'} onChange={e => updateTextLayer(al.id, { gradientTo: e.target.value })} style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4, padding: 0 }} />
                  </div>
                )}
                <div className={s.cameraRow}>
                  <div className={s.sliderMeta}>
                    <span className={s.sliderName}>Opacity</span>
                    <span className={s.sliderVal}>{Math.round(al.opacity * 100)}%</span>
                  </div>
                  <input type="range" className={s.slider} min={0} max={1} step={0.01} value={al.opacity} onChange={e => updateTextLayer(al.id, { opacity: +e.target.value })} />
                </div>
                <div className={s.cameraRow}>
                  <div className={s.sliderMeta}>
                    <span className={s.sliderName}>Glow</span>
                    <span className={s.sliderVal}>{al.glow}</span>
                  </div>
                  <input type="range" className={s.slider} min={0} max={60} value={al.glow} onChange={e => updateTextLayer(al.id, { glow: +e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => updateTextLayer(al.id, { shadow: !al.shadow })} style={{ flex: 1, padding: '4px 0', borderRadius: 5, border: 'none', cursor: 'pointer', background: al.shadow ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.04)', color: al.shadow ? '#d8b4fe' : '#52525b', fontSize: '0.6rem', fontWeight: 600 }}>Shadow</button>
                  <button onClick={() => updateTextLayer(al.id, { hidden: !al.hidden })} style={{ flex: 1, padding: '4px 0', borderRadius: 5, border: 'none', cursor: 'pointer', background: al.hidden ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', color: al.hidden ? '#e4e4e7' : '#52525b', fontSize: '0.6rem', fontWeight: 600 }}>{al.hidden ? 'Show' : 'Hide'}</button>
                </div>
              </div>

              {/* ── LAYOUT ── */}
              <div className={s.textSectionLabel}>LAYOUT</div>
              <div className={s.textPropertiesGrid}>
                <div className={s.cameraRow}>
                  <div className={s.sliderMeta}>
                    <span className={s.sliderName}>X</span>
                    <span className={s.sliderVal}>{Math.round(al.x)}%</span>
                  </div>
                  <input type="range" className={s.slider} min={-80} max={80} step={0.5} value={al.x} onChange={e => updateTextLayer(al.id, { x: +e.target.value })} />
                </div>
                <div className={s.cameraRow}>
                  <div className={s.sliderMeta}>
                    <span className={s.sliderName}>Y</span>
                    <span className={s.sliderVal}>{Math.round(al.y)}%</span>
                  </div>
                  <input type="range" className={s.slider} min={-80} max={80} step={0.5} value={al.y} onChange={e => updateTextLayer(al.id, { y: +e.target.value })} />
                </div>
                <div className={s.cameraRow}>
                  <div className={s.sliderMeta}>
                    <span className={s.sliderName}>Width</span>
                    <span className={s.sliderVal}>{al.width ?? 700}px</span>
                  </div>
                  <input type="range" className={s.slider} min={100} max={1200} step={10} value={al.width ?? 700} onChange={e => updateTextLayer(al.id, { width: +e.target.value })} />
                </div>
                <div className={s.cameraRow}>
                  <div className={s.sliderMeta}>
                    <span className={s.sliderName}>Rotation</span>
                    <span className={s.sliderVal}>{al.rotation ?? 0}°</span>
                  </div>
                  <input type="range" className={s.slider} min={-45} max={45} step={1} value={al.rotation ?? 0} onChange={e => updateTextLayer(al.id, { rotation: +e.target.value })} />
                </div>
                <button style={{ width: '100%', padding: '4px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', color: '#52525b', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  onClick={() => updateTextLayer(al.id, { x: 0, y: 0, rotation: 0 })}>
                  <RotateCcw size={10} /> Reset Position
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Layout Presets */}
      {/* Canvas Format */}
      <div className={s.section}>
        <div className={s.sectionLabel}>Format</div>
        <select
          value={canvasFormat}
          onChange={e => setCanvasFormat(e.target.value as any)}
          className={s.formatSelect}
        >
          <option value="16:9">16:9 (Default)</option>
          <option value="9:16">9:16 (Story)</option>
          <option value="1:1">1:1 (Square)</option>
          <option value="4:3">4:3</option>
          <option value="5:3">5:3 (Product Hunt)</option>
        </select>
      </div>
      <div className={s.section}>
        <div className={s.sectionLabel}>
          <span className={s.sectionLabelDot} />
          Layout Presets
        </div>
        <div className={s.presetGrid}>
          {LAYOUT_PRESETS.map(p => (
            <button
              key={p.id}
              className={`${s.layoutPresetBtn} ${activePreset === p.id ? s.layoutPresetBtnActive : ''}`}
              onClick={() => applyPreset(p)}
              title={p.label}
            >
              <div className={s.layoutPresetThumb}>
                <PresetDiagram id={p.id} />
              </div>
              <span className={s.layoutPresetLabel}>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Camera Controls — shots.so style */}
      <div className={s.section}>

        {/* Tab header */}
        <div className={s.shotsCamHeader}>
          <div className={s.shotsCamTabs}>
            <button
              className={`${s.shotsCamTab} ${cameraTab === 'zoom' ? s.shotsCamTabActive : ''}`}
              onClick={() => setCameraTab('zoom')}
            >Zoom</button>
            <button
              className={`${s.shotsCamTab} ${cameraTab === 'tilt' ? s.shotsCamTabActive : ''}`}
              onClick={() => setCameraTab('tilt')}
            >Tilt</button>
          </div>
          <button
            className={`${s.precisionBtn} ${precision ? s.precisionBtnActive : ''}`}
            onClick={() => setPrecision(v => !v)}
            title="Precision mode: narrows slider range for fine control"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"
              style={{ width: 9, height: 9 }}>
              <circle cx="8" cy="8" r="5.5" />
              <line x1="8" y1="1" x2="8" y2="4" />
              <line x1="8" y1="12" x2="8" y2="15" />
              <line x1="1" y1="8" x2="4" y2="8" />
              <line x1="12" y1="8" x2="15" y2="8" />
            </svg>
            Precision
          </button>
        </div>

        {/* ── ZOOM TAB ── */}
        {cameraTab === 'zoom' && (
          <div className={s.shotsZoomContent}>

            {/* Interactive pan area */}
            <div
              className={s.zoomDragArea}
              onPointerDown={e => {
                isDraggingZoomRef.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                const rect = e.currentTarget.getBoundingClientRect();
                const pctX = ((e.clientX - rect.left) / rect.width) * 100;
                const pctY = ((e.clientY - rect.top) / rect.height) * 100;
                setPosX(Math.round(Math.max(-45, Math.min(45, (pctX - 50) * 0.9))));
                setPosY(Math.round(Math.max(-45, Math.min(45, (pctY - 50) * 0.9))));
                setActivePreset(null);
              }}
              onPointerMove={e => {
                if (!isDraggingZoomRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pctX = ((e.clientX - rect.left) / rect.width) * 100;
                const pctY = ((e.clientY - rect.top) / rect.height) * 100;
                setPosX(Math.round(Math.max(-45, Math.min(45, (pctX - 50) * 0.9))));
                setPosY(Math.round(Math.max(-45, Math.min(45, (pctY - 50) * 0.9))));
                setActivePreset(null);
              }}
              onPointerUp={e => {
                isDraggingZoomRef.current = false;
                e.currentTarget.releasePointerCapture(e.pointerId);
              }}
              onPointerCancel={e => {
                isDraggingZoomRef.current = false;
                e.currentTarget.releasePointerCapture(e.pointerId);
              }}
            >
              <div
                className={s.zoomDevicePin}
                style={{
                  left: `${(posX / 0.9) + 50}%`,
                  top: `${(posY / 0.9) + 50}%`,
                }}
              />
            </div>

            {/* Position X / Y readout */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, marginBottom: 14 }}>
              <span style={{ fontSize: '0.6rem', color: '#71717a' }}>X: {posX}</span>
              <span style={{ fontSize: '0.6rem', color: '#71717a' }}>Y: {posY}</span>
            </div>

            {/* Zoom slider */}
            <div className={s.cameraRow} style={{ marginTop: 8 }}>
              <div className={s.sliderMeta}>
                <span className={s.sliderName}>Zoom</span>
                <span className={s.sliderVal}>{zoom}%</span>
              </div>
              <input
                type="range"
                className={s.slider}
                min={precision ? Math.max(30, zoom - 12) : 30}
                max={precision ? Math.min(130, zoom + 12) : 130}
                step={precision ? 0.5 : 1}
                value={zoom}
                onChange={e => { setZoom(+e.target.value); setActivePreset(null); }}
              />
            </div>
          </div>
        )}

        {/* ── TILT TAB ── */}
        {cameraTab === 'tilt' && (
          <div className={s.shotsTiltContent}>
            <div className={s.cameraRow}>
              <div className={s.sliderMeta}>
                <span className={s.sliderName}>Tilt X</span>
                <span className={s.sliderVal}>{tiltX}°</span>
              </div>
              <input type="range" className={s.slider}
                min={-15} max={15} value={tiltX}
                onChange={e => { setTiltX(+e.target.value); setActivePreset(null); }} />
            </div>
            <div className={s.cameraRow}>
              <div className={s.sliderMeta}>
                <span className={s.sliderName}>Tilt Y</span>
                <span className={s.sliderVal}>{tiltY}°</span>
              </div>
              <input type="range" className={s.slider}
                min={-15} max={15} value={tiltY}
                onChange={e => { setTiltY(+e.target.value); setActivePreset(null); }} />
            </div>
            <div className={s.cameraRow}>
              <div className={s.sliderMeta}>
                <span className={s.sliderName}>Shadow</span>
                <span className={s.sliderVal}>{shadow}</span>
              </div>
              <input type="range" className={s.slider}
                min={0} max={100} value={shadow}
                onChange={e => { setShadow(+e.target.value); setActivePreset(null); }} />
            </div>
          </div>
        )}
      </div>

      {/* Device */}
      <div className={s.section}>
        <div className={s.sectionLabel}>
          <span className={s.sectionLabelDot} />
          Device
        </div>
        <DeviceSelector value={device} onChange={setDevice} />
      </div>

      {/* Browser specific controls */}
      {device === 'browser' && (
        <div className={s.section}>
          <div className={s.sectionLabel}>
            <span className={s.sectionLabelDot} />
            Browser Style
          </div>
          <div className={s.presetGrid}>
            {(['safari-light', 'safari-dark', 'chrome-light', 'chrome-dark', 'arc-light', 'arc-dark'] as const).map(v => (
              <button
                key={v}
                className={`${s.layoutPresetBtn} ${browserVariant === v ? s.layoutPresetBtnActive : ''}`}
                onClick={() => setBrowserVariant(v)}
                style={{ textTransform: 'capitalize', padding: '6px' }}
              >
                {v.replace('-', ' ')}
              </button>
            ))}
          </div>
          <div className={s.cameraRow} style={{ marginTop: 16 }}>
            <div className={s.sliderMeta}>
              <span className={s.sliderName}>UI Scale</span>
              <span className={s.sliderVal}>{browserScale}%</span>
            </div>
            <input type="range" className={s.slider} min={50} max={150} value={browserScale} onChange={e => setBrowserScale(+e.target.value)} />
          </div>
          <div className={s.cameraRow} style={{ marginTop: 12 }}>
            <span className={s.sliderName}>Address Bar URL</span>
            <input type="text" className={s.textInput} style={{ minHeight: '30px' }} value={browserUrl} onChange={e => setBrowserUrl(e.target.value)} placeholder="example.com" />
          </div>
        </div>
      )}

      {/* Screens — only for iPhones */}
      {device.includes('iphone') && (
        <div className={s.section}>
          <div className={s.sectionLabel}>
            <span className={s.sectionLabelDot} />
            Screens
          </div>
          <div className={s.screenCountRow}>
            {([1, 2] as const).map(n => (
              <button
                key={n}
                className={`${s.screenCountBtn} ${screens === n ? s.screenCountBtnActive : ''}`}
                onClick={() => setScreens(n)}
              >
                <span className={s.screenCountIcon}>
                  {Array.from({ length: n }).map((_, i) => (
                    <span key={i} className={s.screenCountBar} />
                  ))}
                </span>
                {n === 1 ? 'Single' : 'Dual'}
              </button>
            ))}
          </div>
          {screens === 2 && (
            <div className={s.layoutPills} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginTop: '8px' }}>
              {(['offset', 'side', 'angled-out', 'angled-in', 'stack', 'overlap'] as const).map(l => (
                <button key={l}
                  className={`${s.layoutPill} ${dualLayout === l ? s.layoutPillActive : ''}`}
                  onClick={() => setDualLayout(l)}
                  style={{ textTransform: 'capitalize' }}
                >{l.replace('-', ' ')}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Frame Color */}
      {device !== 'none' && device !== 'browser' && (
        <div className={s.section}>
          <div className={s.sectionLabel}>
            <span className={s.sectionLabelDot} />
            Frame Color
          </div>
          <div className={s.colorSelector}>
            {FRAME_COLORS.map(c => (
              <button key={c.value} title={c.label}
                className={`${s.colorSwatch} ${frameColor === c.value ? s.colorSwatchActive : ''}`}
                style={{ background: c.color }}
                onClick={() => setFrameColor(c.value)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Background */}
      <div className={s.section}>
        <div className={s.sectionLabel}>
          <span className={s.sectionLabelDot} />
          Background
        </div>
        <div className={s.bgCategories}>
          {BG_CATEGORIES.map(cat => (
            <div key={cat.label} className={s.bgCategory}>
              <div className={s.bgCategoryLabel}>{cat.label}</div>
              <div className={s.bgGrid}>
                {cat.items.map(item => (
                  <button
                    key={item.id}
                    className={`${s.bgSwatch} ${bg.id === item.id ? s.bgSwatchActive : ''}`}
                    style={{ background: item.thumb }}
                    onClick={() => setBg(item)}
                    title={item.label}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export */}
      <div className={s.section}>
        <button className={s.exportPanelToggle} onClick={() => setShowExport(v => !v)}>
          <Download size={11} />
          Export Options
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
            style={{
              width: 10, height: 10, marginLeft: 'auto',
              transform: showExport ? 'rotate(180deg)' : 'none', transition: 'transform .2s'
            }}>
            <polyline points="4,6 8,10 12,6" />
          </svg>
        </button>

        {showExport && (
          <div className={s.exportPanel}>
            <div className={s.sectionLabel} style={{ marginBottom: 6 }}>Mode</div>
            <div className={s.exportModeGrid}>
              {EXPORT_MODES.map(m => (
                <button key={m.id}
                  className={`${s.exportModeBtn} ${exportMode === m.id ? s.exportModeBtnActive : ''}`}
                  onClick={() => setExportMode(m.id)}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
            <div className={s.sectionLabel} style={{ marginTop: 10, marginBottom: 6 }}>Resolution</div>
            <div className={s.exportResGrid}>
              {(['1', '2', '3'] as const).map(r => (
                <button key={r}
                  className={`${s.exportResBtn} ${exportRes === r ? s.exportResBtnActive : ''}`}
                  onClick={() => setExportRes(r)}
                >{r}x</button>
              ))}
            </div>
            <button className={s.exportExecuteBtn} onClick={handleExport}>
              <Download size={13} />
              Export PNG
            </button>
          </div>
        )}
      </div>
    </div>
  );

  /* ═══════════════════════════════════════
     CANVAS
  ═══════════════════════════════════════ */

  const clampedAspect = imageAspect ? Math.max(1.25, Math.min(2.33, imageAspect)) : undefined;

  const frameProps = {
    model: device,
    color: frameColor,
    // scale/rotateX/rotateY are applied on deviceWrapper instead
    // so html2canvas captures the correct DOM layout
    scale: 100,
    rotateX: 0,
    rotateY: 0,
    shadow,
    browserVariant,
    browserUrl,
    browserScale,
    imageAspectRatio: clampedAspect,
  };

  const isContainDevice = device === 'browser' || device === 'macbook-pro';

  const singleDevice = (
    <div
      style={{ cursor: 'pointer', display: 'inline-flex' }}
      className={s.deviceScreenContainer}
      onClick={() => { setActiveSlot(1); fileInputRef.current?.click(); }}
      onDragOver={handleDragOver}
      onDrop={e => handleDrop(e, 1)}
    >
      <DeviceFrame {...frameProps}>
        {image
          ? <img src={image} alt="" className={`${s.uploadedImage} ${isContainDevice ? s.containImage : ''}`} />
          : <UploadPlaceholder />
        }
        {image && (
          <div className={s.deviceUploadOverlay}>
            <div className={s.deviceUploadIconWrapper}>
              <ImageIcon size={24} color="#fff" />
              <div className={s.deviceUploadPlusCircle}>
                <Plus size={10} color="#000" strokeWidth={4} />
              </div>
            </div>
            <div className={s.deviceUploadOverlayText}>Change Image</div>
          </div>
        )}
      </DeviceFrame>
    </div>
  );

  const dualDevice = (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Device 1 — slightly smaller, positioned left */}
      <div
        style={{
          zIndex: (dualLayout === 'side' || dualLayout === 'angled-out' || dualLayout === 'angled-in') ? 1 : 2,
          cursor: 'pointer',
          transform:
            dualLayout === 'offset' ? 'translateX(30px) translateY(30px)' :
              dualLayout === 'side' ? 'translateX(-14px)' :
                dualLayout === 'angled-out' ? 'translateX(-30px) translateY(20px) rotateZ(-12deg)' :
                  dualLayout === 'angled-in' ? 'translateX(-30px) translateY(-10px) rotateZ(12deg)' :
                    dualLayout === 'stack' ? 'translateY(40px) rotateZ(-4deg)' :
                      dualLayout === 'overlap' ? 'translateX(60px) translateY(20px)' :
                        'translateY(40px) rotateZ(-4deg)',
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
        onClick={() => { setActiveSlot(1); fileInputRef.current?.click(); }}
        onDragOver={handleDragOver}
        onDrop={e => handleDrop(e, 1)}
      >
        <DeviceFrame {...frameProps} scale={82}>
          {image ? <img src={image} alt="" className={`${s.uploadedImage} ${isContainDevice ? s.containImage : ''}`} /> : <UploadPlaceholder />}
          {image && (
            <div className={s.deviceUploadOverlay}>
              <div className={s.deviceUploadIconWrapper}>
                <ImageIcon size={24} color="#fff" />
                <div className={s.deviceUploadPlusCircle}>
                  <Plus size={10} color="#000" strokeWidth={4} />
                </div>
              </div>
              <div className={s.deviceUploadOverlayText}>Change Image</div>
            </div>
          )}
        </DeviceFrame>
      </div>
      {/* Device 2 — slightly smaller, positioned right */}
      <div
        style={{
          zIndex: (dualLayout === 'side' || dualLayout === 'angled-out' || dualLayout === 'angled-in') ? 2 : 1,
          cursor: 'pointer',
          transform:
            dualLayout === 'offset' ? 'translateX(-30px) translateY(-30px)' :
              dualLayout === 'side' ? 'translateX(14px)' :
                dualLayout === 'angled-out' ? 'translateX(30px) translateY(0px) rotateZ(12deg)' :
                  dualLayout === 'angled-in' ? 'translateX(30px) translateY(30px) rotateZ(-12deg)' :
                    dualLayout === 'stack' ? 'translateY(-40px) rotateZ(4deg)' :
                      dualLayout === 'overlap' ? 'translateX(-60px) translateY(-20px)' :
                        'translateY(-40px) rotateZ(4deg)',
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
        onClick={() => { setActiveSlot(2); fileInputRef.current?.click(); }}
        onDragOver={handleDragOver}
        onDrop={e => handleDrop(e, 2)}
      >
        <DeviceFrame {...frameProps} scale={82}>
          {image2 ? <img src={image2} alt="" className={`${s.uploadedImage} ${isContainDevice ? s.containImage : ''}`} /> : <UploadPlaceholder />}
          {image2 && (
            <div className={s.deviceUploadOverlay}>
              <div className={s.deviceUploadIconWrapper}>
                <ImageIcon size={24} color="#fff" />
                <div className={s.deviceUploadPlusCircle}>
                  <Plus size={10} color="#000" strokeWidth={4} />
                </div>
              </div>
              <div className={s.deviceUploadOverlayText}>Change Image</div>
            </div>
          )}
        </DeviceFrame>
      </div>
    </div>
  );

  const canvas = (
    <div className={s.previewContainer}>
      {/* Fixed canvas card — size never changes */}
      <div className={s.canvasCard}>
        <div
          ref={canvasBgRef}
          className={s.canvasBg}
          style={(exportMode === 'device' || exportMode === 'tight') ? { ...bg.style, background: 'transparent' } : { ...bg.style, '--canvas-ratio': formatRatios[canvasFormat] } as React.CSSProperties}
        >
          {/* Device floats absolutely inside the fixed bg */}
          <div ref={deviceRef} className={s.deviceWrapper} style={deviceStyle}>
            {screens === 2 && device.includes('iphone') ? dualDevice : singleDevice}
          </div>

          {/* Snap guides */}
          {snapGuides.h && <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(168,85,247,0.5)', pointerEvents: 'none', zIndex: 50 }} />}
          {snapGuides.v && <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(168,85,247,0.5)', pointerEvents: 'none', zIndex: 50 }} />}

          {/* Text Layers */}
          {textLayers.map(layer => {
            if (layer.hidden) return null;
            const txPx = (layer.x / 100) * canvasW;
            const tyPx = (layer.y / 100) * canvasH;
            const isGradient = layer.gradient;
            const gradFrom = layer.gradientFrom ?? '#a855f7';
            const gradTo = layer.gradientTo ?? '#6366f1';
            const isExporting = exportMode === 'device' || exportMode === 'tight';
            return (
              <div
                key={layer.id}
                className={`${s.canvasTextLayer} ${activeLayerId === layer.id && !isExporting ? s.canvasTextLayerActive : ''}`}
                onDoubleClick={() => setEditingLayerId(layer.id)}
                onPointerDown={e => handleTextLayerPointerDown(e, layer.id)}
                onPointerMove={handleTextLayerPointerMove}
                onPointerUp={handleTextLayerPointerUp}
                onPointerCancel={handleTextLayerPointerUp}
                style={{
                  transform: `translate(calc(-50% + ${txPx}px), calc(-50% + ${tyPx}px)) rotate(${layer.rotation ?? 0}deg)`,
                  maxWidth: (layer.width ?? 700) * dynamicScale,
                  width: (layer.width ?? 700) * dynamicScale,
                  textAlign: layer.align,
                  fontFamily: layer.fontFamily,
                  fontSize: layer.fontSize * dynamicScale,
                  fontWeight: layer.fontWeight,
                  opacity: (layer.opacity ?? 1),
                  letterSpacing: layer.letterSpacing,
                  lineHeight: layer.lineHeight,
                  color: isGradient ? 'transparent' : layer.color,
                  backgroundImage: isGradient ? `linear-gradient(135deg, ${gradFrom}, ${gradTo})` : 'none',
                  WebkitBackgroundClip: isGradient ? 'text' : 'border-box',
                  WebkitTextFillColor: isGradient ? 'transparent' : 'inherit',
                  backgroundClip: isGradient ? 'text' : 'border-box',
                  textShadow: [
                    layer.glow > 0 ? `0 0 ${layer.glow}px ${layer.color}` : '',
                    layer.shadow ? '0 4px 24px rgba(0,0,0,0.5)' : '',
                  ].filter(Boolean).join(', ') || 'none',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  pointerEvents: isExporting ? 'none' : 'auto',
                  display: isExporting ? 'none' : 'block',
                  zIndex: layer.zIndex,
                  transition: draggingLayerRef.current === layer.id ? 'none' : 'transform 0.2s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <div
                  key={editingLayerId === layer.id ? 'edit' : 'view'}
                  contentEditable={editingLayerId === layer.id}
                  suppressContentEditableWarning={true}
                  onInput={e => updateTextLayer(layer.id, { text: (e.target as HTMLElement).innerText })}
                  onBlur={() => setEditingLayerId(null)}
                  style={{ outline: 'none', width: '100%', height: '100%' }}
                >
                  {layer.text}
                </div>
                {activeLayerId === layer.id && !isExporting && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        top: -6,
                        left: -6,
                        width: 12,
                        height: 12,
                        background: '#a855f7',
                        cursor: 'nwse-resize',
                      }}
                      onPointerDown={e => {
                        e.stopPropagation();
                        resizeLayerRef.current = layer.id;
                        resizeStartRef.current = { mx: e.clientX, w: layer.width ?? 700 };
                        e.currentTarget.setPointerCapture(e.pointerId);
                      }}
                      onPointerMove={e => {
                        if (resizeLayerRef.current !== layer.id || !resizeStartRef.current) return;
                        const dx = (e.clientX - resizeStartRef.current.mx) / dynamicScale;
                        const newW = Math.max(100, resizeStartRef.current.w + dx);
                        updateTextLayer(layer.id, { width: newW });
                      }}
                      onPointerUp={e => {
                        if (resizeLayerRef.current === layer.id) {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                          resizeLayerRef.current = null;
                          resizeStartRef.current = null;
                        }
                      }}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* ─── Render ─── */
  return (
    <ToolLayout
      title="Mockup Studio"
      description="Cinematic product compositions"
      icon={Monitor}
      actions={
        <button className={s.exportBtn} onClick={handleExport}>
          <Download style={{ width: 13, height: 13 }} />
          Export {exportRes}x PNG
        </button>
      }
    >
      <SplitPanel leftLabel="Inspector" rightLabel="Canvas" left={inspector} right={canvas} />
    </ToolLayout>
  );
}