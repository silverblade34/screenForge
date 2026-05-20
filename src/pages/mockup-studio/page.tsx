'use client';

import {
  useState, useRef, useCallback,
  type CSSProperties, type DragEvent, type ChangeEvent,
} from 'react';
import { ToolLayout, SplitPanel } from '@/components/ui/ToolLayout';
import { Download, Monitor, Crop, Maximize2, Smartphone } from 'lucide-react';
import { exportElementToPNG } from '@/lib/exporters';
import { useToastStore } from '@/lib/toast';
import { DeviceFrame, type DeviceModel, type FrameColor } from '@/components/mockup/DeviceFrame';
import { DeviceSelector } from '@/components/mockup/DeviceSelector';
import s from './page.module.css';

/* ══════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════ */
type ExportMode = 'full' | 'device' | 'tight';

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
      { id: 'cosmic-1', label: 'Aurora',   thumb: 'linear-gradient(135deg,#6d28d9,#4f46e5,#0ea5e9)', style: { background: 'linear-gradient(135deg,#6d28d9 0%,#4f46e5 50%,#0ea5e9 100%)' } },
      { id: 'cosmic-2', label: 'Nebula',   thumb: 'linear-gradient(135deg,#7c3aed,#db2777)', style: { background: 'linear-gradient(135deg,#7c3aed,#db2777)' } },
      { id: 'cosmic-3', label: 'Midnight', thumb: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)', style: { background: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)' } },
      { id: 'cosmic-4', label: 'Void',     thumb: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)', style: { background: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)' } },
    ],
  },
  {
    label: 'Mystic',
    items: [
      { id: 'mystic-1', label: 'Soft',     thumb: 'linear-gradient(135deg,#e0e7ff,#c7d2fe,#ddd6fe)', style: { background: 'linear-gradient(135deg,#e0e7ff,#c7d2fe,#ddd6fe)' } },
      { id: 'mystic-2', label: 'Lavender', thumb: 'linear-gradient(135deg,#ede9fe,#c4b5fd,#a78bfa)', style: { background: 'linear-gradient(135deg,#ede9fe,#c4b5fd,#a78bfa)' } },
      { id: 'mystic-3', label: 'Haze',     thumb: 'linear-gradient(135deg,#f0f9ff,#bae6fd,#7dd3fc)', style: { background: 'linear-gradient(135deg,#f0f9ff,#bae6fd,#7dd3fc)' } },
      { id: 'mystic-4', label: 'Rose',     thumb: 'linear-gradient(135deg,#fff1f2,#fecdd3,#fda4af)', style: { background: 'linear-gradient(135deg,#fff1f2,#fecdd3,#fda4af)' } },
    ],
  },
  {
    label: 'Abstract',
    items: [
      { id: 'abs-1', label: 'Ember',   thumb: 'linear-gradient(135deg,#dc2626,#ea580c,#ca8a04)', style: { background: 'linear-gradient(135deg,#dc2626,#ea580c,#ca8a04)' } },
      { id: 'abs-2', label: 'Forest',  thumb: 'linear-gradient(135deg,#065f46,#059669,#34d399)', style: { background: 'linear-gradient(135deg,#065f46,#059669,#34d399)' } },
      { id: 'abs-3', label: 'Ocean',   thumb: 'linear-gradient(135deg,#0c4a6e,#0284c7,#38bdf8)', style: { background: 'linear-gradient(135deg,#0c4a6e,#0284c7,#38bdf8)' } },
      { id: 'abs-4', label: 'Slate',   thumb: 'linear-gradient(135deg,#1e293b,#334155,#475569)', style: { background: 'linear-gradient(135deg,#1e293b,#334155,#475569)' } },
    ],
  },
  {
    label: 'Radiant',
    items: [
      { id: 'rad-1', label: 'Solar',   thumb: 'radial-gradient(ellipse at 30% 30%,#fde68a,#f59e0b,#b45309)', style: { background: 'radial-gradient(ellipse at 30% 30%,#fde68a,#f59e0b,#b45309)' } },
      { id: 'rad-2', label: 'Glow',    thumb: 'radial-gradient(ellipse at 50% 50%,#a78bfa,#7c3aed,#1e1b4b)', style: { background: 'radial-gradient(ellipse at 50% 50%,#a78bfa,#7c3aed,#1e1b4b)' } },
      { id: 'rad-3', label: 'Frost',   thumb: 'radial-gradient(ellipse at 70% 30%,#e0f2fe,#bae6fd,#0284c7)', style: { background: 'radial-gradient(ellipse at 70% 30%,#e0f2fe,#bae6fd,#0284c7)' } },
      { id: 'rad-4', label: 'Carbon',  thumb: 'radial-gradient(ellipse at 50% 0%,#27272a,#09090b)', style: { background: 'radial-gradient(ellipse at 50% 0%,#27272a,#09090b)' } },
    ],
  },
  {
    label: 'Dark',
    items: [
      { id: 'dark-1', label: 'Pure',   thumb: '#09090b', style: { background: '#09090b' } },
      { id: 'dark-2', label: 'Zinc',   thumb: 'linear-gradient(180deg,#18181b,#09090b)', style: { background: 'linear-gradient(180deg,#18181b,#09090b)' } },
      { id: 'dark-3', label: 'Indigo', thumb: 'linear-gradient(135deg,#1e1b4b,#0f0c29)', style: { background: 'linear-gradient(135deg,#1e1b4b,#0f0c29)' } },
      { id: 'dark-4', label: 'Green',  thumb: 'linear-gradient(135deg,#052e16,#14532d)', style: { background: 'linear-gradient(135deg,#052e16,#14532d)' } },
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
  { id: 'centered',  label: 'Centered',  zoom: 72, posX: 0,    posY: 0,    tiltX: 0,   tiltY: 0,    shadow: 40, bgId: 'cosmic-1' },
  { id: 'hero',      label: 'Hero',      zoom: 88, posX: 0,    posY: 6,    tiltX: 0,   tiltY: 0,    shadow: 55, bgId: 'cosmic-2' },
  { id: 'corner',    label: 'Corner',    zoom: 78, posX: -18,  posY: 12,   tiltX: 4,   tiltY: 8,    shadow: 60, bgId: 'abs-1'    },
  { id: 'floating',  label: 'Floating',  zoom: 68, posX: 0,    posY: -8,   tiltX: 6,   tiltY: 0,    shadow: 80, bgId: 'rad-2'    },
  { id: 'minimal',   label: 'Minimal',   zoom: 60, posX: 0,    posY: 0,    tiltX: 0,   tiltY: 0,    shadow: 18, bgId: 'dark-1'   },
  { id: 'dramatic',  label: 'Dramatic',  zoom: 74, posX: 10,   posY: 5,    tiltX: 8,   tiltY: -10,  shadow: 72, bgId: 'cosmic-3' },
  { id: 'showcase',  label: 'Showcase',  zoom: 78, posX: 16,   posY: 0,    tiltX: 4,   tiltY: -8,   shadow: 62, bgId: 'cosmic-1' },
  { id: 'split',     label: 'Split',     zoom: 66, posX: 0,    posY: 0,    tiltX: 0,   tiltY: 0,    shadow: 48, bgId: 'abs-3'    },
];

/* SVG diagrams for preset thumbnails */
const PresetDiagram = ({ id }: { id: string }) => {
  const ph = '#a855f7'; // purple highlight
  const dim = '#3f3f46';
  const phone = (x: number, y: number, w: number, h: number, opacity = 1) => (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx="2" fill="none" stroke={ph} strokeWidth="1.2"/>
      <rect x={x + w * 0.3} y={y - 0.8} width={w * 0.4} height="1.5" rx="0.75" fill={dim}/>
    </g>
  );

  const diagrams: Record<string, React.ReactNode> = {
    centered:  <>{phone(17, 8, 14, 22)}</>,
    hero:      <>{phone(13, 4, 22, 34)}</>,
    corner:    <>{phone(4,  14, 14, 22)}</>,
    floating:  <>{phone(17, 6, 14, 22)}<rect x="10" y="30" width="28" height="2" rx="1" fill={ph} opacity=".25"/></>,
    minimal:   <>{phone(19, 12, 10, 16)}</>,
    dramatic:  <g transform="rotate(-6 24 24)">{phone(15, 8, 14, 22)}</g>,
    showcase:  <>{phone(20, 8, 13, 21)}{phone(10, 12, 11, 18, 0.4)}</>,
    split:     <>{phone(7,  10, 12, 20)}{phone(23, 10, 12, 20)}</>,
  };

  return (
    <svg viewBox="0 0 48 44" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%' }}>
      <rect width="48" height="44" fill="rgba(255,255,255,0.03)"/>
      {diagrams[id] ?? diagrams.centered}
    </svg>
  );
};

/* ══════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════ */
const FRAME_COLORS: { value: FrameColor; label: string; color: string }[] = [
  { value: 'spaceBlack',      label: 'Space Black',      color: '#151516' },
  { value: 'spaceGray',       label: 'Space Gray',       color: '#53565a' },
  { value: 'silver',          label: 'Silver',           color: '#e5e7eb' },
  { value: 'midnight',        label: 'Midnight',         color: '#1e293b' },
  { value: 'starlight',       label: 'Starlight',        color: '#e2dcd0' },
  { value: 'naturalTitanium', label: 'Natural Titanium', color: '#a8a297' },
  { value: 'titaniumBlue',    label: 'Titanium Blue',    color: '#374754' },
  { value: 'gold',            label: 'Gold',             color: '#e5c199' },
];

const EXPORT_MODES: { id: ExportMode; label: string; icon: React.ReactNode }[] = [
  { id: 'full',   label: 'Full Canvas', icon: <Maximize2 size={11}/> },
  { id: 'device', label: 'Device Only', icon: <Smartphone size={11}/> },
  { id: 'tight',  label: 'Tight Crop',  icon: <Crop size={11}/> },
];

/* ══════════════════════════════════════════════
   UPLOAD PLACEHOLDER
══════════════════════════════════════════════ */
const UploadPlaceholder = () => (
  <div className={s.shotsPlaceholder}>
    <div className={s.mediaStack}>
      <svg className={s.mediaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
      <div className={s.plusCircle}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
          style={{ width: 9, height: 9, color: '#000' }}>
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
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
  const [image,  setImage]  = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<1 | 2>(1);

  /* Device */
  const [device,     setDevice]     = useState<DeviceModel>('iphone-17-pro');
  const [frameColor, setFrameColor] = useState<FrameColor>('spaceBlack');
  const [screens,    setScreens]    = useState<1 | 2>(1);
  const [dualLayout, setDualLayout] = useState<'offset' | 'side' | 'stack'>('offset');

  /* Camera — zoom + position + tilt */
  const [activePreset, setActivePreset] = useState<string | null>('centered');
  const [zoom,   setZoom]   = useState(72);
  const [posX,   setPosX]   = useState(0);   // percent of canvas width
  const [posY,   setPosY]   = useState(0);   // percent of canvas height
  const [tiltX,  setTiltX]  = useState(0);
  const [tiltY,  setTiltY]  = useState(0);
  const [shadow, setShadow] = useState(40);

  /* Camera UI */
  const [cameraTab,  setCameraTab]  = useState<'zoom' | 'tilt'>('zoom');
  const [precision,  setPrecision]  = useState(false);

  /* Background */
  const [bg, setBg] = useState<BgOption>(DEFAULT_BG);

  /* Export */
  const [exportRes,  setExportRes]  = useState<'1' | '2' | '3'>('2');
  const [exportMode, setExportMode] = useState<ExportMode>('full');
  const [showExport, setShowExport] = useState(false);

  const canvasBgRef  = useRef<HTMLDivElement>(null);
  const deviceRef    = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToastStore();

  /* ── Find bg by id ── */
  const findBg = (id: string): BgOption => {
    for (const cat of BG_CATEGORIES) {
      const found = cat.items.find(i => i.id === id);
      if (found) return found;
    }
    return DEFAULT_BG;
  };

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

  /* ── Beautify ── */
  const handleBeautify = useCallback(() => {
    applyPreset(LAYOUT_PRESETS.find(p => p.id === 'floating')!);
    addToast('Composition optimized', 'success');
  }, [applyPreset, addToast]);

  /* ── Export ── */
  const handleExport = useCallback(async () => {
    const target =
      exportMode === 'device' ? deviceRef.current :
      exportMode === 'tight'  ? deviceRef.current :
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
  const canvasW = canvasBgRef.current?.offsetWidth  ?? 800;
  const canvasH = canvasBgRef.current?.offsetHeight ?? 450;
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
      `scale(${zoom / 100})`,
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
        onChange={handleFileChange} style={{ display: 'none' }}/>

      {/* Beautify */}
      <div className={s.section}>
        <button className={s.beautifyBtn} onClick={handleBeautify}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"
            style={{ width: 13, height: 13 }}>
            <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5z"/>
          </svg>
          Beautify
          <span className={s.glowBadge}>Auto</span>
        </button>
      </div>

      {/* Layout Presets */}
      <div className={s.section}>
        <div className={s.sectionLabel}>
          <span className={s.sectionLabelDot}/>
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
                <PresetDiagram id={p.id}/>
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
              <circle cx="8" cy="8" r="5.5"/>
              <line x1="8" y1="1" x2="8" y2="4"/>
              <line x1="8" y1="12" x2="8" y2="15"/>
              <line x1="1" y1="8" x2="4" y2="8"/>
              <line x1="12" y1="8" x2="15" y2="8"/>
            </svg>
            Precision
          </button>
        </div>

        {/* ── ZOOM TAB ── */}
        {cameraTab === 'zoom' && (
          <div className={s.shotsZoomContent}>

            {/* Big zoom number */}
            <div className={s.zoomBigDisplay}>
              <span className={s.zoomBigNum}>{zoom}</span>
              <span className={s.zoomBigUnit}>%</span>
            </div>

            {/* Zoom slider */}
            <input
              type="range"
              className={s.zoomBigSlider}
              min={precision ? Math.max(30, zoom - 12) : 30}
              max={precision ? Math.min(130, zoom + 12) : 130}
              step={precision ? 0.5 : 1}
              value={zoom}
              onChange={e => { setZoom(+e.target.value); setActivePreset(null); }}
            />

            {/* Quick zoom chips */}
            <div className={s.zoomChips}>
              {[40, 60, 75, 90, 110].map(z => (
                <button
                  key={z}
                  className={`${s.zoomChip} ${zoom === z ? s.zoomChipActive : ''}`}
                  onClick={() => { setZoom(z); setActivePreset(null); }}
                >{z}%</button>
              ))}
            </div>

            {/* Position X / Y side by side */}
            <div className={s.posGrid}>
              <div className={s.posItem}>
                <div className={s.posItemHeader}>
                  <span className={s.posItemLabel}>X</span>
                  <span className={s.posItemVal}>{posX > 0 ? '+' : ''}{posX}</span>
                </div>
                <input type="range" className={s.slider}
                  min={-45} max={45} value={posX}
                  onChange={e => { setPosX(+e.target.value); setActivePreset(null); }}/>
              </div>
              <div className={s.posItem}>
                <div className={s.posItemHeader}>
                  <span className={s.posItemLabel}>Y</span>
                  <span className={s.posItemVal}>{posY > 0 ? '+' : ''}{posY}</span>
                </div>
                <input type="range" className={s.slider}
                  min={-45} max={45} value={posY}
                  onChange={e => { setPosY(+e.target.value); setActivePreset(null); }}/>
              </div>
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
                onChange={e => { setTiltX(+e.target.value); setActivePreset(null); }}/>
            </div>
            <div className={s.cameraRow}>
              <div className={s.sliderMeta}>
                <span className={s.sliderName}>Tilt Y</span>
                <span className={s.sliderVal}>{tiltY}°</span>
              </div>
              <input type="range" className={s.slider}
                min={-15} max={15} value={tiltY}
                onChange={e => { setTiltY(+e.target.value); setActivePreset(null); }}/>
            </div>
            <div className={s.cameraRow}>
              <div className={s.sliderMeta}>
                <span className={s.sliderName}>Shadow</span>
                <span className={s.sliderVal}>{shadow}</span>
              </div>
              <input type="range" className={s.slider}
                min={0} max={100} value={shadow}
                onChange={e => { setShadow(+e.target.value); setActivePreset(null); }}/>
            </div>
          </div>
        )}
      </div>

      {/* Device */}
      <div className={s.section}>
        <div className={s.sectionLabel}>
          <span className={s.sectionLabelDot}/>
          Device
        </div>
        <DeviceSelector value={device} onChange={setDevice}/>
      </div>

      {/* Screens — only for iPhones */}
      {device.includes('iphone') && (
        <div className={s.section}>
          <div className={s.sectionLabel}>
            <span className={s.sectionLabelDot}/>
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
                    <span key={i} className={s.screenCountBar}/>
                  ))}
                </span>
                {n === 1 ? 'Single' : 'Dual'}
              </button>
            ))}
          </div>
          {screens === 2 && (
            <div className={s.layoutPills}>
              {(['offset', 'side', 'stack'] as const).map(l => (
                <button key={l}
                  className={`${s.layoutPill} ${dualLayout === l ? s.layoutPillActive : ''}`}
                  onClick={() => setDualLayout(l)}
                >{l}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Frame Color */}
      {device !== 'none' && device !== 'browser' && (
        <div className={s.section}>
          <div className={s.sectionLabel}>
            <span className={s.sectionLabelDot}/>
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
          <span className={s.sectionLabelDot}/>
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
          <Download size={11}/>
          Export Options
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ width: 10, height: 10, marginLeft: 'auto',
              transform: showExport ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
            <polyline points="4,6 8,10 12,6"/>
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
              {(['1','2','3'] as const).map(r => (
                <button key={r}
                  className={`${s.exportResBtn} ${exportRes === r ? s.exportResBtnActive : ''}`}
                  onClick={() => setExportRes(r)}
                >{r}x</button>
              ))}
            </div>
            <button className={s.exportExecuteBtn} onClick={handleExport}>
              <Download size={13}/>
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

  const frameProps = {
    model: device,
    color: frameColor,
    // scale/rotateX/rotateY are applied on deviceWrapper instead
    // so html2canvas captures the correct DOM layout
    scale: 100,
    rotateX: 0,
    rotateY: 0,
    shadow,
  };

  const singleDevice = (
    <div
      style={{ cursor: 'pointer', display: 'inline-flex' }}
      onClick={() => { setActiveSlot(1); fileInputRef.current?.click(); }}
      onDragOver={handleDragOver}
      onDrop={e => handleDrop(e, 1)}
    >
      <DeviceFrame {...frameProps}>
        {image
          ? <img src={image} alt="" className={s.uploadedImage}/>
          : <UploadPlaceholder/>
        }
      </DeviceFrame>
    </div>
  );

  const dualDevice = (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Device 1 — slightly smaller, positioned left */}
      <div
        style={{
          zIndex: dualLayout === 'side' ? 1 : 2,
          cursor: 'pointer',
          transform:
            dualLayout === 'offset' ? 'translateX(30px) translateY(30px)' :
            dualLayout === 'side'   ? 'translateX(-14px)' :
            'translateY(40px) rotateZ(-4deg)',
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
        onClick={() => { setActiveSlot(1); fileInputRef.current?.click(); }}
        onDragOver={handleDragOver}
        onDrop={e => handleDrop(e, 1)}
      >
        <DeviceFrame {...frameProps} scale={82}>
          {image ? <img src={image} alt="" className={s.uploadedImage}/> : <UploadPlaceholder/>}
        </DeviceFrame>
      </div>
      {/* Device 2 — slightly smaller, positioned right */}
      <div
        style={{
          zIndex: dualLayout === 'side' ? 2 : 1,
          cursor: 'pointer',
          transform:
            dualLayout === 'offset' ? 'translateX(-30px) translateY(-30px)' :
            dualLayout === 'side'   ? 'translateX(14px)' :
            'translateY(-40px) rotateZ(4deg)',
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
        onClick={() => { setActiveSlot(2); fileInputRef.current?.click(); }}
        onDragOver={handleDragOver}
        onDrop={e => handleDrop(e, 2)}
      >
        <DeviceFrame {...frameProps} scale={82}>
          {image2 ? <img src={image2} alt="" className={s.uploadedImage}/> : <UploadPlaceholder/>}
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
          style={(exportMode === 'device' || exportMode === 'tight') ? { ...bg.style, background: 'transparent' } : bg.style}
        >
          {/* Device floats absolutely inside the fixed bg */}
          <div ref={deviceRef} className={s.deviceWrapper} style={deviceStyle}>
            {screens === 2 && device.includes('iphone') ? dualDevice : singleDevice}
          </div>
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
          <Download style={{ width: 13, height: 13 }}/>
          Export {exportRes}x PNG
        </button>
      }
    >
      <SplitPanel leftLabel="Inspector" rightLabel="Canvas" left={inspector} right={canvas}/>
    </ToolLayout>
  );
}