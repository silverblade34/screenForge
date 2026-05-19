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

const ASPECT_RATIOS = [
  { value: 'auto', label: 'Auto' },
  { value: '1/1', label: '1:1 (Square)' },
  { value: '16/9', label: '16:9 (Landscape)' },
  { value: '4/3', label: '4:3 (Classic)' },
  { value: '9/16', label: '9:16 (Portrait)' },
];

const EXPORT_RES = [
  { value: '1', label: '1x (SD)' },
  { value: '2', label: '2x (Retina)' },
  { value: '3', label: '3x (Super)' },
];

const ScreenUploadPlaceholder = ({ label = 'Drop or Paste' }: { label?: string }) => {
  return (
    <div className={s.shotsPlaceholder}>
      <div className={s.placeholderIcons}>
        <div className={s.mediaStack}>
          {/* A camera/image style icon */}
          <svg className={s.mediaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <div className={s.plusCircle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3.5 h-3.5 text-black">
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
};

export default function MockupStudioPage() {
  const [image, setImage] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [activeUploadSlot, setActiveUploadSlot] = useState<1 | 2>(1);

  const [device, setDevice] = useState<DeviceModel>('iphone-17-pro');
  const [frameColor, setFrameColor] = useState<FrameColor>('spaceBlack');
  const [background, setBackground] = useState<BackgroundOption>(BACKGROUNDS[0]);
  const [screens, setScreens] = useState(1);
  const [layout, setLayout] = useState('offset');

  // Transform States
  const [scale, setScale] = useState(70);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [shadow, setShadow] = useState(40);

  // Frame Style States
  const [padding, setPadding] = useState(64);
  const [canvasRadius, setCanvasRadius] = useState(16);
  const [aspectRatio, setAspectRatio] = useState('auto');
  const [exportRes, setExportRes] = useState('2');

  const screenshotRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToastStore();

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
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (activeUploadSlot === 1) setImage(event.target?.result as string);
        else setImage2(event.target?.result as string);
        addToast('Imagen cargada exitosamente', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropSlot = (e: React.DragEvent, slot: 1 | 2) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (slot === 1) setImage(event.target?.result as string);
        else setImage2(event.target?.result as string);
        addToast('Imagen cargada exitosamente', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <ToolLayout
      title="Mockup Studio"
      description="Crea composiciones 3D de calidad premium tipo shots.so"
      icon={Monitor}
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <Select
            options={EXPORT_RES}
            value={exportRes}
            onChange={e => setExportRes(e.target.value)}
          />
          <Button variant="primary" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" /> Exportar PNG
          </Button>
        </div>
      }
    >
      <SplitPanel
        leftLabel="Inspector"
        rightLabel="Canvas"
        left={
          <div className={s.controlsContainer}>
            {/* Invisible file input used by clicking the screens */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <div className={s.section}>
              <label className={s.sectionLabel}>Dispositivo</label>
              <DeviceSelector value={device} onChange={setDevice} />
            </div>

            {device.includes('iphone') && (
              <div className={s.section}>
                <label className={s.sectionLabel}>Layout de Pantallas</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    style={{ padding: '8px', borderRadius: '8px', background: screens === 1 ? 'var(--primary)' : 'var(--card)', color: screens === 1 ? '#fff' : 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.75rem' }}
                    onClick={() => setScreens(1)}
                  >
                    1 Pantalla
                  </button>
                  <button
                    style={{ padding: '8px', borderRadius: '8px', background: screens === 2 ? 'var(--primary)' : 'var(--card)', color: screens === 2 ? '#fff' : 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.75rem' }}
                    onClick={() => setScreens(2)}
                  >
                    2 Pantallas
                  </button>
                </div>
                {screens === 2 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
                    {['offset', 'side', 'stack'].map(l => (
                      <button
                        key={l}
                        style={{ padding: '4px', borderRadius: '4px', background: layout === l ? 'var(--primary)' : 'var(--card)', color: layout === l ? '#fff' : 'var(--foreground)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.6rem', textTransform: 'capitalize' }}
                        onClick={() => setLayout(l)}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {device !== 'none' && device !== 'browser' && (
              <div className={s.section}>
                <label className={s.sectionLabel}>Color de Dispositivo</label>
                <div className={s.colorSelector}>
                  {FRAME_COLORS.map(c => (
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

            <div className={s.section}>
              <label className={s.sectionLabel}>Fondo</label>
              <BackgroundPicker value={background} onChange={setBackground} />
            </div>

            <div className={s.divider} />

            <div className={s.section}>
              <label className={s.sectionLabel}>Transformación 3D</label>
              <ControlSlider label="Escala" value={scale} min={50} max={150} unit="%" onChange={setScale} />
              <ControlSlider label="Rotación Z" value={rotateX} min={-45} max={45} unit="°" onChange={setRotateX} />
              <ControlSlider label="Rotación Y" value={rotateY} min={-45} max={45} unit="°" onChange={setRotateY} />
              <ControlSlider label="Sombra 3D" value={shadow} min={0} max={100} onChange={setShadow} />
            </div>

            <div className={s.divider} />

            <div className={s.section}>
              <label className={s.sectionLabel}>Canvas Style</label>
              <ControlSlider label="Padding" value={padding} min={0} max={160} unit="px" onChange={setPadding} />
              <ControlSlider label="Border Radius" value={canvasRadius} min={0} max={64} unit="px" onChange={setCanvasRadius} />
              <div style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>
                <Select label="Aspect Ratio" options={ASPECT_RATIOS} value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} />
              </div>
            </div>
          </div>
        }
        right={
          <div className={s.previewContainer}>
            <div
              ref={screenshotRef}
              className={s.canvas}
              style={{
                ...background.style,
                borderRadius: `${canvasRadius}px`,
                aspectRatio: aspectRatio === 'auto' ? 'auto' : aspectRatio,
                minWidth: aspectRatio !== 'auto' ? '600px' : 'auto',
              }}
            >
              {screens === 1 || !device.includes('iphone') ? (
                <div
                  onClick={() => { setActiveUploadSlot(1); fileInputRef.current?.click(); }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropSlot(e, 1)}
                  style={{ cursor: 'pointer' }}
                >
                  <DeviceFrame
                    model={device}
                    color={frameColor}
                    scale={scale}
                    rotateX={rotateX}
                    rotateY={rotateY}
                    shadow={shadow}
                  >
                    {image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={image} alt="Screenshot" className={s.uploadedImage} />
                    ) : (
                      <ScreenUploadPlaceholder label="Drop or Paste" />
                    )}
                  </DeviceFrame>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0px', alignItems: 'center', justifyContent: 'center' }}>
                  <div
                    onClick={() => { setActiveUploadSlot(1); fileInputRef.current?.click(); }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropSlot(e, 1)}
                    style={{ zIndex: layout === 'side' ? 1 : 2, cursor: 'pointer' }}
                  >
                    <DeviceFrame
                      model={device}
                      color={frameColor}
                      scale={scale * 0.85}
                      rotateX={rotateX}
                      rotateY={rotateY}
                      shadow={shadow}
                      style={{
                        transform: `scale(${(scale * 0.85) / 100}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) 
                          ${layout === 'offset' ? 'translateX(40px) translateY(40px)' : layout === 'side' ? 'translateX(-20px)' : 'translateY(60px) rotateZ(-5deg)'}`
                      }}
                    >
                      {image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={image} alt="Screenshot" className={s.uploadedImage} />
                      ) : (
                        <ScreenUploadPlaceholder label="Drop or Paste" />
                      )}
                    </DeviceFrame>
                  </div>
                  <div
                    onClick={() => { setActiveUploadSlot(2); fileInputRef.current?.click(); }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropSlot(e, 2)}
                    style={{ zIndex: layout === 'side' ? 2 : 1, cursor: 'pointer' }}
                  >
                    <DeviceFrame
                      model={device}
                      color={frameColor}
                      scale={scale * 0.85}
                      rotateX={rotateX}
                      rotateY={rotateY}
                      shadow={shadow}
                      style={{
                        transform: `scale(${(scale * 0.85) / 100}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) 
                          ${layout === 'offset' ? 'translateX(-40px) translateY(-40px)' : layout === 'side' ? 'translateX(20px)' : 'translateY(-60px) rotateZ(5deg)'}`
                      }}
                    >
                      {image2 ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={image2} alt="Screenshot" className={s.uploadedImage} />
                      ) : (
                        <ScreenUploadPlaceholder label="Drop or Paste" />
                      )}
                    </DeviceFrame>
                  </div>
                </div>
              )}
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
