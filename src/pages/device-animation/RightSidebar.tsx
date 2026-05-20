'use client';

import React from 'react';
import {
  Zap, Sliders, Film, Wind, Maximize2, Move, Sparkles, Eye, Slash,
  Activity, Clock, Settings2, Download, Gauge, ScrollText, PlayCircle, PlusCircle, Network,
  Layers, ZoomIn,
} from 'lucide-react';
import {
  AnimationPreset, EasingType, SceneScene, SceneMode,
  ANIMATION_PRESETS,
} from './types';
import s from './page.module.css';

interface Props {
  scene: SceneScene;
  scenes: SceneScene[];
  onModeChange: (m: SceneMode) => void;
  onAnimationChange: (a: AnimationPreset) => void;
  onEasingChange: (e: EasingType) => void;
  onDurationChange: (d: number) => void;
  onCameraSpeedChange: (s: number) => void;
  onScrollSpeedChange: (s: number) => void;
  onHotspotUpdate: (id: string, targetSceneId: string) => void;
  onHotspotDelete: (id: string) => void;
}

const EASINGS: { value: EasingType; label: string }[] = [
  { value: 'spring',     label: 'Spring' },
  { value: 'ease-out',   label: 'Ease Out' },
  { value: 'ease-in-out',label: 'Ease In-Out' },
  { value: 'linear',     label: 'Linear' },
  { value: 'anticipate', label: 'Anticipate' },
  { value: 'bounce',     label: 'Bounce' },
];

const SCENE_PRESETS: { label: string; desc: string; animation: AnimationPreset; easing: EasingType }[] = [
  { label: 'App Showcase',    desc: 'Floating drift loop',           animation: 'floating-drift',  easing: 'ease-in-out' },
  { label: 'Hero Launch',     desc: 'Fade + scale entrance',         animation: 'hero-reveal',     easing: 'ease-out' },
  { label: 'Feature Focus',   desc: 'Rack-focus lens pull',          animation: 'focus-pull',      easing: 'ease-out' },
  { label: 'Dashboard Demo',  desc: 'Camera slide + stable device',  animation: 'camera-slide',    easing: 'ease-out' },
  { label: 'Detail Zoom',     desc: 'Precision zoom for showcases',  animation: 'precision-zoom',  easing: 'spring'   },
];

const getAnimationIcon = (iconName: string) => {
  switch (iconName) {
    case 'slash':      return <Slash size={12} />;
    case 'film':       return <Film size={12} />;
    case 'wind':       return <Wind size={12} />;
    case 'maximize-2': return <Maximize2 size={12} />;
    case 'move':       return <Move size={12} />;
    case 'sparkles':   return <Sparkles size={12} />;
    case 'eye':        return <Eye size={12} />;
    case 'zap':        return <Zap size={12} />;
    case 'scroll':     return <ScrollText size={12} />;
    case 'layers':     return <Layers size={12} />;
    case 'zoom-in':    return <ZoomIn size={12} />;
    default:           return <Sliders size={12} />;
  }
};

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className={s.sectionHeader}>
      <div className={s.sectionIcon}>{icon}</div>
      <span className={s.sectionLabel}>{label}</span>
    </div>
  );
}

export default function RightSidebar({ 
  scene, scenes, onModeChange, onAnimationChange, onEasingChange, 
  onDurationChange, onCameraSpeedChange, onScrollSpeedChange, 
  onHotspotUpdate, onHotspotDelete 
}: Props) {
  const speed = scene.cameraSpeed ?? 1;
  const mode = scene.mode || 'animation';

  return (
    <>
      {/* Scene Mode Selector */}
      <div className={s.inspectorSection}>
        <SectionHeader icon={<Settings2 size={10} />} label="Scene Mode" />
        <div className={s.modeGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 12 }}>
          <button 
            className={`${s.easingBtn} ${mode === 'animation' ? s.easingBtnActive : ''}`}
            onClick={() => onModeChange('animation')}
            title="Classic 3D animation"
            style={{ padding: '6px 4px', fontSize: '0.55rem' }}
          >
            <Film size={12} style={{ margin: '0 auto 4px auto', display: 'block' }} />
            Animation
          </button>
          <button 
            className={`${s.easingBtn} ${mode === 'scroll' ? s.easingBtnActive : ''}`}
            onClick={() => onModeChange('scroll')}
            title="Auto-scroll long screenshot"
            style={{ padding: '6px 4px', fontSize: '0.55rem' }}
          >
            <ScrollText size={12} style={{ margin: '0 auto 4px auto', display: 'block' }} />
            Scroll
          </button>
          <button 
            className={`${s.easingBtn} ${mode === 'flow' ? s.easingBtnActive : ''}`}
            onClick={() => onModeChange('flow')}
            title="Interactive prototype flow"
            style={{ padding: '6px 4px', fontSize: '0.55rem' }}
          >
            <Network size={12} style={{ margin: '0 auto 4px auto', display: 'block' }} />
            Flow
          </button>
        </div>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {mode === 'animation' && 'Cinematic camera-first motion — elegant, Apple-inspired movement.'}
          {mode === 'scroll' && 'Upload a long vertical image to auto-scroll inside the screen.'}
          {mode === 'flow' && 'Click on the device screen to add interactive hotspots that link to other scenes.'}
        </p>
      </div>

      {mode === 'animation' && (
        <>
          <div className={s.inspectorSection}>
            <SectionHeader icon={<Zap size={10} />} label="Scene Presets" />
            <div className={s.presetGrid}>
              {SCENE_PRESETS.map(p => (
                <button
                  key={p.label}
                  className={`${s.presetBtn} ${scene.animation === p.animation ? s.presetBtnActive : ''}`}
                  onClick={() => { onAnimationChange(p.animation); onEasingChange(p.easing); }}
                >
                  <div className={s.presetMeta}>
                    <span className={s.presetName}>{p.label}</span>
                    <span className={s.presetDesc}>{p.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={s.inspectorSection}>
            <SectionHeader icon={<Sliders size={10} />} label="Animation" />
            <div className={s.presetGrid}>
              {ANIMATION_PRESETS.map(a => (
                <button
                  key={a.value}
                  className={`${s.presetBtn} ${scene.animation === a.value ? s.presetBtnActive : ''}`}
                  onClick={() => onAnimationChange(a.value)}
                >
                  <span className={s.presetIcon}>{getAnimationIcon(a.icon)}</span>
                  <div className={s.presetMeta}>
                    <span className={s.presetName}>{a.label}</span>
                    <span className={s.presetDesc}>{a.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={s.inspectorSection}>
            <SectionHeader icon={<Activity size={10} />} label="Easing" />
            <div className={s.easingGrid}>
              {EASINGS.map(e => (
                <button
                  key={e.value}
                  className={`${s.easingBtn} ${scene.easing === e.value ? s.easingBtnActive : ''}`}
                  onClick={() => onEasingChange(e.value)}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {mode === 'scroll' && (
        <div className={s.inspectorSection}>
          <SectionHeader icon={<Clock size={10} />} label="Scroll Speed" />
          <div className={s.inputRow}>
            <label className={s.inputLabel}>Scroll Duration (seconds)</label>
            <input
              type="number"
              className={s.numberInput}
              min={1} max={60} step={1}
              value={scene.scrollSpeed ?? 6}
              onChange={e => {
                const val = parseFloat(e.target.value);
                onScrollSpeedChange(val);
                onDurationChange(val);
              }}
            />
          </div>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
            Time it takes to scroll from the top of the image to the bottom.
          </p>
        </div>
      )}

      {mode === 'flow' && (
        <div className={s.inspectorSection}>
          <SectionHeader icon={<Network size={10} />} label="Hotspots" />
          {(scene.hotspots || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.1)' }}>
              <PlusCircle size={16} style={{ color: '#a1a1aa', margin: '0 auto 8px auto' }} />
              <p style={{ fontSize: '0.65rem', color: '#71717a' }}>Click on the device screen to add a hotspot.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {scene.hotspots.map((h, i) => (
                <div key={h.id} style={{ padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#e4e4e7' }}>Hotspot {i + 1}</span>
                    <button onClick={() => onHotspotDelete(h.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.6rem', cursor: 'pointer' }}>Delete</button>
                  </div>
                  <div className={s.inputRow} style={{ margin: 0 }}>
                    <label className={s.inputLabel}>Navigate to</label>
                    <select 
                      className={s.numberInput} 
                      style={{ width: '100%', padding: '4px 6px', marginTop: 4 }}
                      value={h.targetSceneId}
                      onChange={e => onHotspotUpdate(h.id, e.target.value)}
                    >
                      <option value="">Select a scene...</option>
                      {scenes.filter(s => s.id !== scene.id).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Common Properties: Duration & Camera Speed */}
      <div className={s.inspectorSection}>
        <SectionHeader icon={<Clock size={10} />} label="Scene Duration" />
        <div className={s.inputRow}>
          <label className={s.inputLabel}>Duration (seconds)</label>
          <input
            type="number"
            className={s.numberInput}
            min={0.5} max={30} step={0.5}
            value={scene.duration}
            onChange={e => onDurationChange(parseFloat(e.target.value))}
          />
        </div>
        <div className={s.twoCol} style={{ marginTop: 8 }}>
          {[1,2,3,4,5,6].map(d => (
            <button
              key={d}
              className={`${s.easingBtn} ${scene.duration === d ? s.easingBtnActive : ''}`}
              onClick={() => onDurationChange(d)}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      <div className={s.inspectorSection}>
        <SectionHeader icon={<Gauge size={10} />} label="Camera Speed" />
        <div className={s.sliderRow}>
          <div className={s.sliderMeta}>
            <span className={s.sliderName}>Transition Speed</span>
            <span className={s.sliderVal}>{speed.toFixed(1)}×</span>
          </div>
          <input
            type="range" className={s.slider}
            min={0.1} max={3} step={0.1}
            value={speed}
            onChange={e => onCameraSpeedChange(parseFloat(e.target.value))}
          />
        </div>
        <div className={s.twoCol} style={{ marginTop: 8 }}>
          {[{ label: 'Slow', v: 0.3 }, { label: 'Normal', v: 1 }, { label: 'Fast', v: 2 }, { label: 'Instant', v: 3 }].map(o => (
            <button
              key={o.label}
              className={`${s.easingBtn} ${Math.abs(speed - o.v) < 0.05 ? s.easingBtnActive : ''}`}
              onClick={() => onCameraSpeedChange(o.v)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Export Settings */}
      <div className={s.inspectorSection}>
        <SectionHeader icon={<Download size={10} />} label="Export" />
        <div className={s.easingGrid}>
          {['MP4', 'WebM', 'GIF', 'PNG'].map(f => (
            <button
              key={f}
              className={`${s.easingBtn} ${f === 'MP4' ? s.easingBtnActive : ''}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
