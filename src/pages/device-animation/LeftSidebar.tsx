'use client';

import React from 'react';
import { Monitor, Smartphone, Globe, Layers, Camera, Palette, Sun, Laptop, Square, Eye, EyeOff } from 'lucide-react';
import {
  DeviceModel, FrameColor, BackgroundOption,
  CameraState, Layer, FRAME_COLORS, BACKGROUNDS, DEFAULT_CAMERA,
} from './types';
import { BrowserVariant } from '@/components/mockup/DeviceFrame';
import s from './page.module.css';

interface Props {
  device: DeviceModel;
  frameColor: FrameColor;
  background: BackgroundOption;
  camera: CameraState;
  layers: Layer[];
  activeLayer: string;
  onDevice: (d: DeviceModel) => void;
  onFrameColor: (c: FrameColor) => void;
  onBackground: (b: BackgroundOption) => void;
  onCamera: (c: Partial<CameraState>) => void;
  onLayerSelect: (id: string) => void;
  onLayerToggle: (id: string) => void;
  browserVariant?: BrowserVariant;
  onBrowserVariant?: (v: BrowserVariant) => void;
}

const DEVICES: { value: DeviceModel; label: string }[] = [
  { value: 'iphone-16-pro', label: 'iPhone' },
  { value: 'macbook-pro', label: 'MacBook' },
  { value: 'browser', label: 'Browser' },
];

const BROWSER_VARIANTS: { value: BrowserVariant; label: string }[] = [
  { value: 'safari-light', label: 'Safari Light' },
  { value: 'safari-dark', label: 'Safari Dark' },
  { value: 'chrome-light', label: 'Chrome Light' },
  { value: 'chrome-dark', label: 'Chrome Dark' },
  { value: 'arc-light', label: 'Arc Light' },
  { value: 'arc-dark', label: 'Arc Dark' },
];

const CAMERA_PRESETS: { label: string; cam: Partial<CameraState> }[] = [
  { label: 'Reset', cam: { ...DEFAULT_CAMERA } },
  { label: 'Zoom Top', cam: { zoom: 1.4, panY: -80, tiltX: 8 } },
  { label: 'Zoom Bottom', cam: { zoom: 1.4, panY: 80, tiltX: -8 } },
  { label: 'Wide', cam: { zoom: 0.7, panX: 0, panY: 0 } },
  { label: 'Side Left', cam: { panX: -120, tiltY: 15 } },
  { label: 'Side Right', cam: { panX: 120, tiltY: -15 } },
];

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className={s.sectionHeader}>
      <div className={s.sectionIcon}>{icon}</div>
      <span className={s.sectionLabel}>{label}</span>
    </div>
  );
}

function SliderRow({ label, value, min, max, step = 1, onChange, unit = '' }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string;
}) {
  return (
    <div className={s.sliderRow}>
      <div className={s.sliderMeta}>
        <span className={s.sliderName}>{label}</span>
        <span className={s.sliderVal}>{value.toFixed(step < 1 ? 1 : 0)}{unit}</span>
      </div>
      <input
        type="range" className={s.slider}
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

export default function LeftSidebar({
  device, frameColor, background, camera, layers, activeLayer,
  onDevice, onFrameColor, onBackground, onCamera, onLayerSelect, onLayerToggle,
  browserVariant, onBrowserVariant,
}: Props) {
  return (
    <>
      {/* Device */}
      <div className={s.inspectorSection}>
        <SectionHeader icon={<Smartphone size={10} />} label="Device" />
        <div className={s.deviceGrid}>
          {DEVICES.map(d => {
            const getDeviceIcon = () => {
              if (d.value.startsWith('iphone')) return <Smartphone size={12} />;
              if (d.value === 'macbook-pro') return <Laptop size={12} />;
              if (d.value === 'browser') return <Globe size={12} />;
              return <Square size={12} />;
            };
            return (
              <button
                key={d.value}
                className={`${s.deviceOption} ${device === d.value ? s.deviceOptionActive : ''}`}
                onClick={() => onDevice(d.value)}
              >
                <span className={s.deviceOptionIcon}>{getDeviceIcon()}</span>
                <span style={{ fontSize: '0.56rem', lineHeight: 1.2 }}>{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Frame Color */}
      {device !== 'none' && device !== 'browser' && (
        <div className={s.inspectorSection}>
          <SectionHeader icon={<Palette size={10} />} label="Frame Color" />
          <div className={s.frameGrid}>
            {FRAME_COLORS.map(c => (
              <button
                key={c.value}
                title={c.label}
                className={`${s.frameOption} ${frameColor === c.value ? s.frameOptionActive : ''}`}
                onClick={() => onFrameColor(c.value)}
              >
                <div 
                  className={s.frameOptionImg}
                  style={{
                    backgroundImage: `url(${c.preview})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center bottom',
                  }}
                />
                <span className={s.frameOptionLabel}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Browser Variant */}
      {device === 'browser' && onBrowserVariant && (
        <div className={s.inspectorSection}>
          <SectionHeader icon={<Globe size={10} />} label="Browser Style" />
          <div className={s.deviceGrid}>
            {BROWSER_VARIANTS.map(v => (
              <button
                key={v.value}
                className={`${s.deviceOption} ${browserVariant === v.value ? s.deviceOptionActive : ''}`}
                onClick={() => onBrowserVariant(v.value)}
              >
                <span style={{ fontSize: '0.56rem', lineHeight: 1.2 }}>{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Background */}
      <div className={s.inspectorSection}>
        <SectionHeader icon={<Globe size={10} />} label="Background" />
        <div className={s.bgGrid}>
          {BACKGROUNDS.map(bg => (
            <button
              key={bg.id}
              title={bg.label}
              className={`${s.bgOption} ${background.id === bg.id ? s.bgOptionActive : ''}`}
              style={{ ...bg.style }}
              onClick={() => onBackground(bg)}
            />
          ))}
        </div>
      </div>

      {/* Camera */}
      <div className={s.inspectorSection}>
        <SectionHeader icon={<Camera size={10} />} label="Camera" />
        <div className={s.sliderGroup}>
          <SliderRow label="Zoom" value={camera.zoom} min={0.3} max={2.5} step={0.05} onChange={v => onCamera({ zoom: v })} />
          <SliderRow label="Pan X" value={camera.panX} min={-300} max={300} onChange={v => onCamera({ panX: v })} unit="px" />
          <SliderRow label="Pan Y" value={camera.panY} min={-300} max={300} onChange={v => onCamera({ panY: v })} unit="px" />
          <SliderRow label="Tilt X" value={camera.tiltX} min={-30} max={30} onChange={v => onCamera({ tiltX: v })} unit="°" />
          <SliderRow label="Tilt Y" value={camera.tiltY} min={-30} max={30} onChange={v => onCamera({ tiltY: v })} unit="°" />
          <SliderRow label="Rotation" value={camera.rotation} min={-45} max={45} onChange={v => onCamera({ rotation: v })} unit="°" />
          <SliderRow label="Focus Blur" value={camera.blur} min={0} max={20} onChange={v => onCamera({ blur: v })} unit="px" />
        </div>
        <div className={s.cameraGrid} style={{ marginTop: 10 }}>
          {CAMERA_PRESETS.map(p => (
            <button
              key={p.label}
              className={s.cameraPresetBtn}
              onClick={() => onCamera(p.cam)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lighting */}
      <div className={s.inspectorSection}>
        <SectionHeader icon={<Sun size={10} />} label="Lighting" />
        <div className={s.sliderGroup}>
          <SliderRow label="Ambient" value={80} min={0} max={100} onChange={() => { }} unit="%" />
          <SliderRow label="Glow" value={60} min={0} max={100} onChange={() => { }} unit="%" />
          <SliderRow label="Rim Light" value={40} min={0} max={100} onChange={() => { }} unit="%" />
        </div>
      </div>

      {/* Layers */}
      <div className={s.inspectorSection}>
        <SectionHeader icon={<Layers size={10} />} label="Layers" />
        <div className={s.layerList}>
          {layers.map(layer => (
            <div
              key={layer.id}
              className={`${s.layerItem} ${activeLayer === layer.id ? s.layerItemActive : ''}`}
              onClick={() => onLayerSelect(layer.id)}
            >
              <div className={s.layerDot} style={{ background: layer.color }} />
              <span className={s.layerName}>{layer.name}</span>
              <span className={s.layerOpacity}>{layer.opacity}%</span>
              <button
                className={s.layerVis}
                onClick={e => { e.stopPropagation(); onLayerToggle(layer.id); }}
              >
                {layer.visible ? <Eye size={12} style={{ opacity: 0.8 }} /> : <EyeOff size={12} style={{ opacity: 0.4 }} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
