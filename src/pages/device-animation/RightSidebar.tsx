'use client';

import React from 'react';
import {
  Zap, Sliders, Film, Wind, Maximize2, Move, Sparkles, Eye, Slash,
  Activity, Clock, Settings2, Download, Gauge, ScrollText, PlayCircle, PlusCircle, Network,
  Layers, ZoomIn, Trash2,
} from 'lucide-react';
import {
  AnimationPreset, EasingType, SceneScene, SceneMode, TextLayer,
  ANIMATION_PRESETS, FONT_PRESETS,
} from './types';
import s from './page.module.css';
import { Type } from 'lucide-react';

interface Props {
  scene: SceneScene;
  scenes: SceneScene[];
  onModeChange: (m: SceneMode) => void;
  onAnimationChange: (a: AnimationPreset) => void;
  onEasingChange: (e: EasingType) => void;
  onDurationChange: (d: number) => void;
  onCameraSpeedChange: (s: number) => void;
  onScrollSpeedChange: (s: number) => void;
  onHotspotUpdate: (id: string, updates: Partial<import('./types').FlowHotspot>) => void;
  onHotspotDelete: (id: string) => void;
  onSceneRename: (name: string) => void;
  onSceneDelete: () => void;

  textLayers?: TextLayer[];
  setTextLayers?: React.Dispatch<React.SetStateAction<TextLayer[]>>;
  activeTextLayerId?: string | null;
  setActiveTextLayerId?: (id: string | null) => void;
  updateTextLayer?: (id: string, updates: Partial<TextLayer>) => void;
  deleteTextLayer?: (id: string) => void;
}

const EASINGS: { value: EasingType; label: string }[] = [
  { value: 'spring', label: 'Spring' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
  { value: 'linear', label: 'Linear' },
  { value: 'anticipate', label: 'Anticipate' },
  { value: 'bounce', label: 'Bounce' },
];

const SCENE_PRESETS: { label: string; desc: string; animation: AnimationPreset; easing: EasingType }[] = [
  { label: 'App Showcase', desc: 'Floating drift loop', animation: 'floating-drift', easing: 'ease-in-out' },
  { label: 'Hero Launch', desc: 'Fade + scale entrance', animation: 'hero-reveal', easing: 'ease-out' },
  { label: 'Feature Focus', desc: 'Rack-focus lens pull', animation: 'focus-pull', easing: 'ease-out' },
  { label: 'Dashboard Demo', desc: 'Camera slide + stable device', animation: 'camera-slide', easing: 'ease-out' },
  { label: 'Detail Zoom', desc: 'Precision zoom for showcases', animation: 'precision-zoom', easing: 'spring' },
];

const getAnimationIcon = (iconName: string) => {
  switch (iconName) {
    case 'slash': return <Slash size={12} />;
    case 'film': return <Film size={12} />;
    case 'wind': return <Wind size={12} />;
    case 'maximize-2': return <Maximize2 size={12} />;
    case 'move': return <Move size={12} />;
    case 'sparkles': return <Sparkles size={12} />;
    case 'eye': return <Eye size={12} />;
    case 'zap': return <Zap size={12} />;
    case 'scroll': return <ScrollText size={12} />;
    case 'layers': return <Layers size={12} />;
    case 'zoom-in': return <ZoomIn size={12} />;
    default: return <Sliders size={12} />;
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
  onHotspotUpdate, onHotspotDelete, onSceneRename, onSceneDelete,
  textLayers = [], setTextLayers, activeTextLayerId, setActiveTextLayerId,
  updateTextLayer, deleteTextLayer
}: Props) {
  const speed = scene.cameraSpeed ?? 1;
  const mode = scene.mode || 'animation';

  const activeTextLayer = activeTextLayerId ? textLayers.find(l => l.id === activeTextLayerId) : null;

  return (
    <>
      {/* ── TEXT LAYER EDITOR (Takes precedence if a text layer is selected) ── */}
      {activeTextLayer && updateTextLayer && deleteTextLayer && setTextLayers && setActiveTextLayerId && (
        <>
          <div className={s.inspectorSection} style={{ paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f4f4f5' }}>
                <Type size={12} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Edit Text</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className={s.textDeleteBtn} title="Duplicate" onClick={() => {
                  const id = `text-${Date.now()}`;
                  setTextLayers(prev => [...prev, { ...activeTextLayer, id, x: activeTextLayer.x + 2, y: activeTextLayer.y + 2, zIndex: prev.length + 1 }]);
                  setActiveTextLayerId(id);
                }}><Layers size={11} /></button>
                <button className={s.textDeleteBtn} onClick={() => deleteTextLayer(activeTextLayer.id)}><Trash2 size={11} /></button>
              </div>
            </div>

            <textarea
              className={s.textInput}
              value={activeTextLayer.text}
              onChange={e => updateTextLayer(activeTextLayer.id, { text: e.target.value })}
              placeholder="Your text..."
              rows={3}
            />

            <div className={s.textSectionLabel}>FONT</div>
            <div className={s.fontPresetGrid}>
              {FONT_PRESETS.map(fp => (
                <button
                  key={fp.id}
                  className={`${s.fontPresetBtn} ${activeTextLayer.fontPreset === fp.id ? s.fontPresetBtnActive : ''}`}
                  onClick={() => updateTextLayer(activeTextLayer.id, { fontPreset: fp.id, fontFamily: fp.font })}
                  style={{ fontFamily: fp.font }}
                >
                  <span className={s.fontPreviewChar}>{fp.preview}</span>
                  <span className={s.fontPreviewLabel}>{fp.label}</span>
                </button>
              ))}
            </div>

            <div className={s.textSectionLabel}>TEXT STYLE</div>
            <div className={s.textPropertiesGrid}>
              <div className={s.cameraRow}>
                <div className={s.sliderMeta}>
                  <span className={s.sliderName}>Size</span>
                  <span className={s.sliderVal}>{activeTextLayer.fontSize}px</span>
                </div>
                <input type="range" className={s.slider} min={10} max={140} value={activeTextLayer.fontSize} onChange={e => updateTextLayer(activeTextLayer.id, { fontSize: +e.target.value })} />
              </div>
              <div className={s.cameraRow}>
                <div className={s.sliderMeta}>
                  <span className={s.sliderName}>Weight</span>
                  <span className={s.sliderVal}>{activeTextLayer.fontWeight}</span>
                </div>
                <input type="range" className={s.slider} min={100} max={900} step={100} value={activeTextLayer.fontWeight} onChange={e => updateTextLayer(activeTextLayer.id, { fontWeight: +e.target.value })} />
              </div>
              <div className={s.cameraRow}>
                <div className={s.sliderMeta}>
                  <span className={s.sliderName}>Spacing</span>
                  <span className={s.sliderVal}>{activeTextLayer.letterSpacing}px</span>
                </div>
                <input type="range" className={s.slider} min={-5} max={10} step={0.5} value={activeTextLayer.letterSpacing} onChange={e => updateTextLayer(activeTextLayer.id, { letterSpacing: +e.target.value })} />
              </div>
              <div className={s.cameraRow}>
                <div className={s.sliderMeta}>
                  <span className={s.sliderName}>Line Height</span>
                  <span className={s.sliderVal}>{activeTextLayer.lineHeight.toFixed(1)}</span>
                </div>
                <input type="range" className={s.slider} min={0.5} max={2.5} step={0.1} value={activeTextLayer.lineHeight} onChange={e => updateTextLayer(activeTextLayer.id, { lineHeight: +e.target.value })} />
              </div>
            </div>

            <div className={s.textSectionLabel}>TIMING & ANIMATION</div>
            <div className={s.textPropertiesGrid}>
              <div className={s.cameraRow}>
                <div className={s.sliderMeta}>
                  <span className={s.sliderName}>Start Time</span>
                  <span className={s.sliderVal}>{(activeTextLayer.startTime ?? 0).toFixed(1)}s</span>
                </div>
                <input type="range" className={s.slider} min={0} max={30} step={0.1} value={activeTextLayer.startTime ?? 0} onChange={e => updateTextLayer(activeTextLayer.id, { startTime: +e.target.value })} />
              </div>
              <div className={s.cameraRow}>
                <div className={s.sliderMeta}>
                  <span className={s.sliderName}>Duration</span>
                  <span className={s.sliderVal}>{(activeTextLayer.duration ?? 3).toFixed(1)}s</span>
                </div>
                <input type="range" className={s.slider} min={0.5} max={30} step={0.1} value={activeTextLayer.duration ?? 3} onChange={e => updateTextLayer(activeTextLayer.id, { duration: +e.target.value })} />
              </div>
              <div className={s.inputRow} style={{ margin: '4px 0 0 0' }}>
                <label className={s.inputLabel}>Entrance Animation</label>
                <select
                  className={s.numberInput}
                  style={{ width: '100%', padding: '4px 6px', marginTop: 4 }}
                  value={activeTextLayer.animationIn || 'fade'}
                  onChange={e => updateTextLayer(activeTextLayer.id, { animationIn: e.target.value as any })}
                >
                  <option value="none">None</option>
                  <option value="fade">Fade In</option>
                  <option value="typewriter">Typewriter</option>
                  <option value="bounce">Bounce</option>
                  <option value="slide-up">Slide Up</option>
                </select>
              </div>
            </div>

            <div className={s.textSectionLabel}>COLOR & EFFECTS</div>
            <div className={s.textPropertiesGrid}>
              <div className={s.inputRow} style={{ margin: 0 }}>
                <label className={s.inputLabel}>Solid Color</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="color" value={activeTextLayer.color} onChange={e => updateTextLayer(activeTextLayer.id, { color: e.target.value, gradient: false })} style={{ width: 24, height: 24, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'none' }} />
                  <input type="text" className={s.numberInput} value={activeTextLayer.color} onChange={e => updateTextLayer(activeTextLayer.id, { color: e.target.value, gradient: false })} style={{ flex: 1, padding: '4px 8px' }} />
                </div>
              </div>

              <div className={s.inputRow} style={{ margin: '4px 0' }}>
                <label className={s.inputLabel}>Gradient (Optional)</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="checkbox" checked={activeTextLayer.gradient} onChange={e => updateTextLayer(activeTextLayer.id, { gradient: e.target.checked })} />
                  <input type="color" value={activeTextLayer.gradientFrom ?? '#a855f7'} disabled={!activeTextLayer.gradient} onChange={e => updateTextLayer(activeTextLayer.id, { gradientFrom: e.target.value })} style={{ width: 24, height: 24, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'none', opacity: activeTextLayer.gradient ? 1 : 0.5 }} />
                  <input type="color" value={activeTextLayer.gradientTo ?? '#6366f1'} disabled={!activeTextLayer.gradient} onChange={e => updateTextLayer(activeTextLayer.id, { gradientTo: e.target.value })} style={{ width: 24, height: 24, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'none', opacity: activeTextLayer.gradient ? 1 : 0.5 }} />
                </div>
              </div>

              <div className={s.cameraRow}>
                <div className={s.sliderMeta}>
                  <span className={s.sliderName}>Opacity</span>
                  <span className={s.sliderVal}>{Math.round((activeTextLayer.opacity ?? 1) * 100)}%</span>
                </div>
                <input type="range" className={s.slider} min={0} max={1} step={0.05} value={activeTextLayer.opacity ?? 1} onChange={e => updateTextLayer(activeTextLayer.id, { opacity: +e.target.value })} />
              </div>
              <div className={s.cameraRow}>
                <div className={s.sliderMeta}>
                  <span className={s.sliderName}>Glow</span>
                  <span className={s.sliderVal}>{activeTextLayer.glow}px</span>
                </div>
                <input type="range" className={s.slider} min={0} max={40} value={activeTextLayer.glow} onChange={e => updateTextLayer(activeTextLayer.id, { glow: +e.target.value })} />
              </div>
            </div>

            <div className={s.textSectionLabel}>ALIGNMENT</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['left', 'center', 'right'].map(align => (
                <button
                  key={align}
                  className={`${s.tlBtn} ${activeTextLayer.align === align ? s.tlBtnActive : ''}`}
                  style={{ flex: 1, padding: 4 }}
                  onClick={() => updateTextLayer(activeTextLayer.id, { align: align as any })}
                >
                  <span style={{ fontSize: '0.6rem', textTransform: 'capitalize' }}>{align}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── SCENE INSPECTOR (Visible if no text layer is actively selected) ── */}
      <div style={{ display: activeTextLayer ? 'none' : 'block' }}>
        {/* Scene Identity */}
        <div className={s.inspectorSection} style={{ paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              className={s.numberInput}
              style={{ flex: 1, padding: '6px 8px', fontSize: '0.7rem', fontWeight: 600 }}
              value={scene.name}
              onChange={e => onSceneRename(e.target.value)}
              placeholder="Scene Name"
            />
            <button
              onClick={onSceneDelete}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title="Delete Scene"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Scene Mode Selector */}
        <div className={s.inspectorSection}>
          <SectionHeader icon={<Settings2 size={10} />} label="Scene Mode" />
          <div className={s.modeGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 12 }}>
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
            {/* <button
            className={`${s.easingBtn} ${mode === 'flow' ? s.easingBtnActive : ''}`}
            onClick={() => onModeChange('flow')}
            title="Interactive prototype flow"
            style={{ padding: '6px 4px', fontSize: '0.55rem' }}
          >
            <Network size={12} style={{ margin: '0 auto 4px auto', display: 'block' }} />
            Flow
          </button> */}
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
                <p style={{ fontSize: '0.65rem', color: '#71717a' }}>Click anywhere on the device screen to add a cinematic hotspot.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scene.hotspots.map((h, i) => (
                  <div key={h.id} style={{ padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#e4e4e7' }}>Hotspot {i + 1}</span>
                      <button onClick={() => onHotspotDelete(h.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.6rem', cursor: 'pointer' }}>Delete</button>
                    </div>

                    {/* Target Scene */}
                    <div className={s.inputRow} style={{ margin: '4px 0' }}>
                      <label className={s.inputLabel}>Navigate to</label>
                      <select
                        className={s.numberInput}
                        style={{ width: '100%', padding: '4px 6px', marginTop: 4 }}
                        value={h.targetSceneId || ''}
                        onChange={e => onHotspotUpdate(h.id, { targetSceneId: e.target.value })}
                      >
                        <option value="">Select target scene...</option>
                        {scenes.filter(s => s.id !== scene.id).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Label */}
                    <div className={s.inputRow} style={{ margin: '4px 0' }}>
                      <label className={s.inputLabel}>Label (Optional)</label>
                      <input
                        type="text"
                        className={s.numberInput}
                        style={{ width: '100%', padding: '4px 6px', marginTop: 4, textAlign: 'left' }}
                        value={h.label || ''}
                        placeholder="e.g. Explore Feature"
                        onChange={e => onHotspotUpdate(h.id, { label: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                      {/* Shape */}
                      <div className={s.inputRow} style={{ margin: 0 }}>
                        <label className={s.inputLabel}>Shape</label>
                        <select
                          className={s.numberInput}
                          style={{ width: '100%', padding: '4px 6px', marginTop: 4 }}
                          value={h.shape || 'circle'}
                          onChange={e => onHotspotUpdate(h.id, { shape: e.target.value as any })}
                        >
                          <option value="circle">Circle</option>
                          <option value="pill">Pill</option>
                          <option value="invisible">Invisible</option>
                        </select>
                      </div>

                      {/* Animation */}
                      <div className={s.inputRow} style={{ margin: 0 }}>
                        <label className={s.inputLabel}>Animation</label>
                        <select
                          className={s.numberInput}
                          style={{ width: '100%', padding: '4px 6px', marginTop: 4 }}
                          value={h.animationPreset || 'pulse'}
                          onChange={e => onHotspotUpdate(h.id, { animationPreset: e.target.value as any })}
                        >
                          <option value="none">None</option>
                          <option value="pulse">Pulse</option>
                          <option value="glow">Glow</option>
                          <option value="float">Float</option>
                          <option value="fade">Fade</option>
                          <option value="ripple">Ripple</option>
                        </select>
                      </div>
                    </div>

                    {/* Opacity */}
                    <div className={s.inputRow} style={{ margin: '8px 0 0 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <label className={s.inputLabel}>Opacity</label>
                        <span className={s.inputLabel}>{h.opacity !== undefined ? h.opacity : 100}%</span>
                      </div>
                      <input
                        type="range"
                        className={s.slider}
                        min={0} max={100}
                        value={h.opacity !== undefined ? h.opacity : 100}
                        onChange={e => onHotspotUpdate(h.id, { opacity: parseInt(e.target.value) })}
                      />
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
            {[1, 2, 3, 4, 5, 6].map(d => (
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
      </div>
    </>
  );
}
