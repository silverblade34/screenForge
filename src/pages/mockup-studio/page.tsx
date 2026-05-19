'use client';

import { useState, useRef, useCallback } from 'react';
import { ToolLayout, SplitPanel, Button, Select } from '@/components/ui/ToolLayout';
import { Download, Monitor } from 'lucide-react';
import { exportElementToPNG } from '@/lib/exporters';
import { useToastStore } from '@/lib/toast';
import { DeviceFrame, DeviceModel, FrameColor } from '@/components/mockup/DeviceFrame';
import { BackgroundPicker, BACKGROUNDS, BackgroundOption } from '@/components/mockup/BackgroundPicker';
import { DeviceSelector } from '@/components/mockup/DeviceSelector';
import { ControlSlider } from '@/components/mockup/ControlSlider';
import s from './page.module.css';

/* ── Types ── */
type UIMode = 'beginner' | 'pro';
type CameraPresetKey =
  | 'Front'
  | 'Perspective'
  | 'Isometric'
  | 'Dramatic'
  | 'Floating'
  | 'Hero'
  | 'Showcase'
  | 'Orbit';

/* ── Camera Presets ── */
interface CameraPreset {
  label: CameraPresetKey;
  icon: string;
  rotateX: number;
  rotateY: number;
  scale: number;
  shadow: number;
}

const CAMERA_PRESETS: CameraPreset[] = [
  { label: 'Front',       icon: '⬜', rotateX: 0,   rotateY: 0,   scale: 80, shadow: 30 },
  { label: 'Perspective', icon: '◻️', rotateX: 12,  rotateY: -18, scale: 75, shadow: 55 },
  { label: 'Isometric',   icon: '⬡',  rotateX: 30,  rotateY: -30, scale: 70, shadow: 60 },
  { label: 'Dramatic',    icon: '🎬', rotateX: 20,  rotateY: -35, scale: 68, shadow: 70 },
  { label: 'Floating',    icon: '🪐', rotateX: 8,   rotateY: 0,   scale: 72, shadow: 65 },
  { label: 'Hero',        icon: '⚡', rotateX: 5,   rotateY: -12, scale: 82, shadow: 50 },
  { label: 'Showcase',    icon: '✨', rotateX: 15,  rotateY: 20,  scale: 74, shadow: 58 },
  { label: 'Orbit',       icon: '🔄', rotateX: 25,  rotateY: 45,  scale: 65, shadow: 72 },
];

/* ── Beautify defaults ── */
const BEAUTIFY_STATE = {
  scale: 74,
  rotateX: 12,
  rotateY: -18,
  shadow: 60,
  padding: 80,
  canvasRadius: 20,
  aspectRatio: '16/9',
  activeCamera: 'Perspective' as CameraPresetKey,
};

/* ── Constants ── */
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

const ASPECT_RATIOS = [
  { value: 'auto', label: 'Auto' },
  { value: '1/1',  label: '1:1 Square' },
  { value: '16/9', label: '16:9 Landscape' },
  { value: '4/3',  label: '4:3 Classic' },
  { value: '9/16', label: '9:16 Portrait' },
];

const EXPORT_RES = [
  { value: '1', label: '1x' },
  { value: '2', label: '2x' },
  { value: '3', label: '3x' },
];

/* ── Upload Placeholder ── */
const ScreenUploadPlaceholder = ({ label = 'Drop or Paste' }: { label?: string }) => (
  <div className={s.shotsPlaceholder}>
    <div className={s.placeholderIcons}>
      <div className={s.mediaStack}>
        <svg className={s.mediaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <div className={s.plusCircle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 10, height: 10, color: '#000' }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      </div>
    </div>
    <div className={s.placeholderText}>{label}</div>
    <div className={s.placeholderSubtext}>Images & Videos</div>
  </div>
);

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function MockupStudioPage() {
  /* ── Images ── */
  const [image, setImage]   = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [activeUploadSlot, setActiveUploadSlot] = useState<1 | 2>(1);

  /* ── Device ── */
  const [device, setDevice]         = useState<DeviceModel>('iphone-17-pro');
  const [frameColor, setFrameColor] = useState<FrameColor>('spaceBlack');
  const [screens, setScreens]       = useState(1);
  const [layout, setLayout]         = useState('offset');

  /* ── Camera / Transform ── */
  const [activeCamera, setActiveCamera] = useState<CameraPresetKey | null>(null);
  const [scale, setScale]     = useState(70);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [shadow, setShadow]   = useState(40);

  /* ── Background ── */
  const [background, setBackground] = useState<BackgroundOption>(BACKGROUNDS[0]);

  /* ── Canvas Style ── */
  const [padding, setPadding]           = useState(64);
  const [canvasRadius, setCanvasRadius] = useState(16);
  const [aspectRatio, setAspectRatio]   = useState('auto');

  /* ── Export ── */
  const [exportRes, setExportRes] = useState('2');

  /* ── UI Mode ── */
  const [mode, setMode] = useState<UIMode>('beginner');

  const screenshotRef = useRef<HTMLDivElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const { addToast }  = useToastStore();

  /* ── Handlers ── */
  const handleExport = useCallback(async () => {
    if (!screenshotRef.current) return;
    addToast('Generando mockup premium...', 'info');
    try {
      await exportElementToPNG(screenshotRef.current, `mockup-${Date.now()}.png`);
      addToast('Mockup exportado exitosamente', 'success');
    } catch {
      addToast('Error al exportar', 'error');
    }
  }, [addToast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (activeUploadSlot === 1) setImage(result);
      else setImage2(result);
      addToast('Imagen cargada exitosamente', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDropSlot = (e: React.DragEvent, slot: 1 | 2) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (slot === 1) setImage(result);
        else setImage2(result);
        addToast('Imagen cargada exitosamente', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  /* ── Camera Preset Apply ── */
  const applyCamera = (preset: CameraPreset) => {
    setActiveCamera(preset.label);
    setScale(preset.scale);
    setRotateX(preset.rotateX);
    setRotateY(preset.rotateY);
    setShadow(preset.shadow);
  };

  /* ── Beautify ── */
  const handleBeautify = () => {
    setScale(BEAUTIFY_STATE.scale);
    setRotateX(BEAUTIFY_STATE.rotateX);
    setRotateY(BEAUTIFY_STATE.rotateY);
    setShadow(BEAUTIFY_STATE.shadow);
    setPadding(BEAUTIFY_STATE.padding);
    setCanvasRadius(BEAUTIFY_STATE.canvasRadius);
    setAspectRatio(BEAUTIFY_STATE.aspectRatio);
    setActiveCamera(BEAUTIFY_STATE.activeCamera);
    // Pick a non-flat background if current is the first (plain) one
    if (BACKGROUNDS[3]) setBackground(BACKGROUNDS[3]);
    addToast('✨ Composición optimizada', 'success');
  };

  /* ── Shared device frame props ── */
  const frameProps = { model: device, color: frameColor, scale, rotateX, rotateY, shadow };

  /* ════════════════════════════════════
     INSPECTOR
  ════════════════════════════════════ */
  const inspector = (
    <div className={s.controlsContainer}>
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* ── Mode Toggle ── */}
      <div className={s.section}>
        <div className={s.modeToggle}>
          <button
            className={`${s.modeBtn} ${mode === 'beginner' ? s.modeBtnActive : ''}`}
            onClick={() => setMode('beginner')}
          >
            ⚡ Beginner
          </button>
          <button
            className={`${s.modeBtn} ${mode === 'pro' ? s.modeBtnActive : ''}`}
            onClick={() => setMode('pro')}
          >
            🛠 Pro
          </button>
        </div>
      </div>

      {/* ── Beautify (always visible) ── */}
      <div className={s.section}>
        <button className={s.beautifyBtn} onClick={handleBeautify}>
          ✨ Beautify
          <span className={s.glowBadge}>Auto</span>
        </button>
      </div>

      {/* ── Camera Presets ── */}
      <div className={s.section}>
        <div className={s.sectionLabel}>Camera Preset</div>
        <div style={{ marginTop: 8 }}>
          <div className={s.cameraGrid}>
            {CAMERA_PRESETS.map((preset) => (
              <button
                key={preset.label}
                className={`${s.cameraPresetBtn} ${activeCamera === preset.label ? s.cameraPresetBtnActive : ''}`}
                onClick={() => applyCamera(preset)}
              >
                <span className={s.cameraPresetIcon}>{preset.icon}</span>
                <span className={s.cameraPresetLabel}>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Device ── */}
      <div className={s.section}>
        <div className={s.sectionLabel}>Dispositivo</div>
        <div style={{ marginTop: 8 }}>
          <DeviceSelector value={device} onChange={setDevice} />
        </div>
      </div>

      {/* ── Screen Layout (iPhone only) ── */}
      {device.includes('iphone') && (
        <div className={s.section}>
          <div className={s.sectionLabel}>Pantallas</div>
          <div className={s.screenTabs} style={{ marginTop: 8 }}>
            <button
              className={`${s.screenTab} ${screens === 1 ? s.screenTabActive : ''}`}
              onClick={() => setScreens(1)}
            >
              1 Pantalla
            </button>
            <button
              className={`${s.screenTab} ${screens === 2 ? s.screenTabActive : ''}`}
              onClick={() => setScreens(2)}
            >
              2 Pantallas
            </button>
          </div>
          {screens === 2 && (
            <div className={s.layoutPills}>
              {['offset', 'side', 'stack'].map((l) => (
                <button
                  key={l}
                  className={`${s.layoutPill} ${layout === l ? s.layoutPillActive : ''}`}
                  onClick={() => setLayout(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Frame Color ── */}
      {device !== 'none' && device !== 'browser' && (
        <div className={s.section}>
          <div className={s.sectionLabel}>Color de Dispositivo</div>
          <div className={s.colorSelector} style={{ marginTop: 8 }}>
            {FRAME_COLORS.map((c) => (
              <button
                key={c.value}
                title={c.label}
                className={`${s.colorSwatch} ${frameColor === c.value ? s.colorSwatchActive : ''}`}
                style={{ background: c.color }}
                onClick={() => setFrameColor(c.value)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Background ── */}
      <div className={s.section}>
        <div className={s.sectionLabel}>Fondo</div>
        <div style={{ marginTop: 8 }}>
          <BackgroundPicker value={background} onChange={setBackground} />
        </div>
      </div>

      {/* ── PRO: 3D Transform Sliders ── */}
      {mode === 'pro' && (
        <div className={`${s.section} ${s.proSection}`}>
          <div className={s.sectionLabel}>Transformación 3D</div>
          <div className={s.sliderGroup} style={{ marginTop: 10 }}>
            <ControlSlider label="Escala"    value={scale}   min={50}  max={150} unit="%" onChange={(v) => { setScale(v);   setActiveCamera(null); }} />
            <ControlSlider label="Rotación X" value={rotateX} min={-45} max={45}  unit="°" onChange={(v) => { setRotateX(v); setActiveCamera(null); }} />
            <ControlSlider label="Rotación Y" value={rotateY} min={-45} max={45}  unit="°" onChange={(v) => { setRotateY(v); setActiveCamera(null); }} />
            <ControlSlider label="Sombra 3D" value={shadow}  min={0}   max={100}       onChange={(v) => { setShadow(v);  setActiveCamera(null); }} />
          </div>
        </div>
      )}

      {/* ── PRO: Canvas Style ── */}
      {mode === 'pro' && (
        <div className={`${s.section} ${s.proSection}`}>
          <div className={s.sectionLabel}>Canvas Style</div>
          <div className={s.sliderGroup} style={{ marginTop: 10 }}>
            <ControlSlider label="Padding"       value={padding}       min={0} max={160} unit="px" onChange={setPadding} />
            <ControlSlider label="Border Radius" value={canvasRadius}  min={0} max={64}  unit="px" onChange={setCanvasRadius} />
          </div>
          <div style={{ marginTop: 10 }}>
            <Select
              label="Aspect Ratio"
              options={ASPECT_RATIOS}
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );

  /* ════════════════════════════════════
     CANVAS
  ════════════════════════════════════ */
  const canvas = (
    <div className={s.previewContainer}>
      <div
        ref={screenshotRef}
        className={s.canvas}
        style={{
          ...background.style,
          borderRadius: `${canvasRadius}px`,
          padding: `${padding}px`,
          aspectRatio: aspectRatio === 'auto' ? 'auto' : aspectRatio,
          minWidth: aspectRatio !== 'auto' ? '600px' : 'auto',
        }}
      >
        {screens === 1 || !device.includes('iphone') ? (
          /* ── Single device ── */
          <div
            onClick={() => { setActiveUploadSlot(1); fileInputRef.current?.click(); }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropSlot(e, 1)}
            style={{ cursor: 'pointer' }}
          >
            <DeviceFrame {...frameProps}>
              {image
                ? <img src={image} alt="Screenshot" className={s.uploadedImage} />
                : <ScreenUploadPlaceholder label="Drop or Paste" />
              }
            </DeviceFrame>
          </div>
        ) : (
          /* ── Dual device ── */
          <div style={{ display: 'flex', gap: '0px', alignItems: 'center', justifyContent: 'center' }}>
            {/* Device 1 */}
            <div
              onClick={() => { setActiveUploadSlot(1); fileInputRef.current?.click(); }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropSlot(e, 1)}
              style={{ zIndex: layout === 'side' ? 1 : 2, cursor: 'pointer' }}
            >
              <DeviceFrame
                {...frameProps}
                scale={scale * 0.85}
                style={{
                  transform: `scale(${(scale * 0.85) / 100}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${
                    layout === 'offset' ? 'translateX(40px) translateY(40px)' :
                    layout === 'side'   ? 'translateX(-20px)' :
                    'translateY(60px) rotateZ(-5deg)'
                  }`
                }}
              >
                {image
                  ? <img src={image} alt="Screenshot" className={s.uploadedImage} />
                  : <ScreenUploadPlaceholder label="Drop or Paste" />
                }
              </DeviceFrame>
            </div>

            {/* Device 2 */}
            <div
              onClick={() => { setActiveUploadSlot(2); fileInputRef.current?.click(); }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropSlot(e, 2)}
              style={{ zIndex: layout === 'side' ? 2 : 1, cursor: 'pointer' }}
            >
              <DeviceFrame
                {...frameProps}
                scale={scale * 0.85}
                style={{
                  transform: `scale(${(scale * 0.85) / 100}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${
                    layout === 'offset' ? 'translateX(-40px) translateY(-40px)' :
                    layout === 'side'   ? 'translateX(20px)' :
                    'translateY(-60px) rotateZ(5deg)'
                  }`
                }}
              >
                {image2
                  ? <img src={image2} alt="Screenshot" className={s.uploadedImage} />
                  : <ScreenUploadPlaceholder label="Drop or Paste" />
                }
              </DeviceFrame>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ════════════════════════════════════
     RENDER
  ════════════════════════════════════ */
  return (
    <ToolLayout
      title="Mockup Studio"
      description="Composiciones cinematográficas de producto"
      icon={Monitor}
      actions={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Select
            options={EXPORT_RES}
            value={exportRes}
            onChange={(e) => setExportRes(e.target.value)}
          />
          <button className={s.exportBtn} onClick={handleExport}>
            <Download style={{ width: 14, height: 14 }} />
            Exportar PNG
          </button>
        </div>
      }
    >
      <SplitPanel
        leftLabel="Inspector"
        rightLabel="Canvas"
        left={inspector}
        right={canvas}
      />
    </ToolLayout>
  );
}