'use client';

import React from 'react';
import {
  Zap, Sliders, Film, Wind, RotateCw, Maximize2, Move, Sparkles, Box, Rocket, Eye, Slash, Activity, Clock, Settings2, Download
} from 'lucide-react';
import {
  AnimationPreset, EasingType, SceneScene,
  ANIMATION_PRESETS,
} from './types';
import s from './page.module.css';

interface Props {
  scene: SceneScene;
  onAnimationChange: (a: AnimationPreset) => void;
  onEasingChange: (e: EasingType) => void;
  onDurationChange: (d: number) => void;
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
  { label: 'App Showcase',    desc: 'Floating iPhone with glow',    animation: 'startup-launch',   easing: 'spring' },
  { label: 'Dashboard Demo',  desc: 'MacBook cinematic pan',        animation: 'camera-pan',        easing: 'ease-out' },
  { label: 'Feature Zoom',    desc: 'Dolly in on detail',          animation: 'dolly-zoom',        easing: 'ease-in-out' },
  { label: 'Perspective Hero',desc: '3D perspective unfold',        animation: 'perspective-reveal', easing: 'spring' },
  { label: 'Orbit Launch',    desc: 'Orbital rotation entrance',   animation: 'orbit',             easing: 'ease-in-out' },
];

const getAnimationIcon = (iconName: string) => {
  switch (iconName) {
    case 'slash': return <Slash size={12} />;
    case 'film': return <Film size={12} />;
    case 'wind': return <Wind size={12} />;
    case 'rotate-cw': return <RotateCw size={12} />;
    case 'maximize-2': return <Maximize2 size={12} />;
    case 'move': return <Move size={12} />;
    case 'sparkles': return <Sparkles size={12} />;
    case 'box': return <Box size={12} />;
    case 'rocket': return <Rocket size={12} />;
    case 'eye': return <Eye size={12} />;
    case 'zap': return <Zap size={12} />;
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

export default function RightSidebar({ scene, onAnimationChange, onEasingChange, onDurationChange }: Props) {
  return (
    <>
      {/* Scene Presets */}
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

      {/* Animation Type */}
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

      {/* Easing */}
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

      {/* Duration */}
      <div className={s.inspectorSection}>
        <SectionHeader icon={<Clock size={10} />} label="Duration" />
        <div className={s.inputRow}>
          <label className={s.inputLabel}>Scene Duration (seconds)</label>
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

      {/* Motion Quality */}
      <div className={s.inspectorSection}>
        <SectionHeader icon={<Settings2 size={10} />} label="Motion Quality" />
        <div className={s.sliderGroup ?? 'sliderGroup'} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Motion Blur', val: 40 },
            { label: 'Depth of Field', val: 60 },
            { label: 'Smoothing', val: 80 },
          ].map(({ label, val }) => (
            <div key={label} className={s.sliderRow}>
              <div className={s.sliderMeta}>
                <span className={s.sliderName}>{label}</span>
                <span className={s.sliderVal}>{val}%</span>
              </div>
              <input type="range" className={s.slider} min={0} max={100} defaultValue={val} />
            </div>
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
        <div style={{ marginTop: 8 }}>
          <div className={s.sliderRow}>
            <div className={s.sliderMeta}>
              <span className={s.sliderName}>Quality</span>
              <span className={s.sliderVal}>60fps</span>
            </div>
            <input type="range" className={s.slider} min={24} max={120} defaultValue={60} />
          </div>
        </div>
      </div>
    </>
  );
}
