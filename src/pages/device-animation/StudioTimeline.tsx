'use client';

import React, { useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { SceneScene } from './types';
import s from './page.module.css';

interface Props {
  scenes: SceneScene[];
  activeSceneId: string;
  currentTime: number;
  isPlaying: boolean;
  totalDuration: number;
  onSelectScene: (id: string) => void;
  onTimeChange: (t: number) => void;
  onPlayPause: () => void;
  onRestart: () => void;
}

const TRACK_LABELS = ['Camera', 'Device', 'Glow', 'BG'];
const TRACK_COLORS = ['#7c3aed', '#0ea5e9', '#a855f7', '#10b981'];

export default function StudioTimeline({
  scenes, activeSceneId, currentTime, isPlaying,
  totalDuration, onSelectScene, onTimeChange, onPlayPause, onRestart,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  const seekTo = useCallback((e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    onTimeChange(pct * totalDuration);
  }, [totalDuration, onTimeChange]);

  const playheadPct = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // Build scene clips with pixel positions — pure reduce, no mutation during render
  const clips = scenes.reduce<(SceneScene & { left: number; width: number })[]>((acc, sc) => {
    const offset = acc.reduce((sum, c) => sum + c.duration, 0);
    const left = totalDuration > 0 ? (offset / totalDuration) * 100 : 0;
    const width = totalDuration > 0 ? (sc.duration / totalDuration) * 100 : 0;
    return [...acc, { ...sc, left, width }];
  }, []);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s2 = (t % 60).toFixed(1).padStart(4, '0');
    return `${m}:${s2}`;
  };

  return (
    <div className={s.timeline}>
      {/* Header row */}
      <div className={s.timelineHeader}>
        <div className={s.timelineControls}>
          <button className={s.tlBtn} onClick={onRestart} title="Restart">
            <SkipBack size={10} />
          </button>
          <button className={`${s.tlBtn} ${isPlaying ? s.tlBtnActive : ''}`} onClick={onPlayPause}>
            {isPlaying ? <Pause size={10} /> : <Play size={10} />}
          </button>
          <button className={s.tlBtn} title="Skip to end">
            <SkipForward size={10} />
          </button>
        </div>

        <span className={s.tlTime}>
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </span>

        <div className={s.tlSpacer} />

        {/* Scene tabs in timeline */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {scenes.map(sc => (
            <button
              key={sc.id}
              className={`${s.tlBtn} ${activeSceneId === sc.id ? s.tlBtnActive : ''}`}
              onClick={() => onSelectScene(sc.id)}
              style={{ padding: '0 8px', width: 'auto', fontSize: '0.6rem', fontWeight: 600 }}
            >
              {sc.name}
            </button>
          ))}
        </div>

        <div className={s.tlZoom}>
          <span>1x</span>
        </div>
      </div>

      {/* Body */}
      <div className={s.timelineBody}>
        {/* Labels */}
        <div className={s.timelineLabels}>
          <div className={s.tlLabel} style={{ height: 18, fontSize: '0.5rem', color: '#3f3f46', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            SCENES
          </div>
          {TRACK_LABELS.map(l => (
            <div key={l} className={s.tlLabel}>{l}</div>
          ))}
        </div>

        {/* Tracks */}
        <div className={s.timelineTracks} ref={trackRef} onClick={seekTo}>
          {/* Ruler */}
          <div className={s.timelineRuler}>
            {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => {
              const pct = totalDuration > 0 ? (i / totalDuration) * 100 : 0;
              return (
                <React.Fragment key={i}>
                  <div className={s.rulerMark} style={{ left: `${pct}%`, height: i % 5 === 0 ? 8 : 4 }} />
                  {i % 2 === 0 && (
                    <span className={s.rulerLabel} style={{ left: `${pct}%` }}>{i}s</span>
                  )}
                </React.Fragment>
              );
            })}

            {/* Scene clips on ruler row */}
            {clips.map(clip => (
              <div
                key={clip.id}
                className={s.trackClip}
                onClick={e => { e.stopPropagation(); onSelectScene(clip.id); }}
                style={{
                  left: `${clip.left}%`,
                  width: `calc(${clip.width}% - 2px)`,
                  background: clip.id === activeSceneId
                    ? `${clip.color}33`
                    : `${clip.color}18`,
                  border: `1px solid ${clip.color}60`,
                  color: clip.color,
                  top: 0,
                  height: 17,
                  transform: 'none',
                }}
              >
                {clip.name}
              </div>
            ))}
          </div>

          {/* Track rows */}
          {TRACK_LABELS.map((_, idx) => (
            <div key={idx} className={s.trackRow}>
              {clips.map(clip => (
                <div
                  key={clip.id}
                  className={s.trackClip}
                  style={{
                    left: `${clip.left}%`,
                    width: `calc(${clip.width}% - 2px)`,
                    background: `${TRACK_COLORS[idx]}18`,
                    border: `1px solid ${TRACK_COLORS[idx]}30`,
                    color: TRACK_COLORS[idx],
                  }}
                >
                  {idx === 0 ? clip.animation.split('-').map(w => w[0].toUpperCase()).join('') : ''}
                </div>
              ))}
              {/* Keyframe diamonds */}
              {clips.map(clip => (
                <div
                  key={`kf-${clip.id}`}
                  className={s.keyframe}
                  style={{
                    left: `${clip.left + clip.width / 2}%`,
                    background: TRACK_COLORS[idx],
                    boxShadow: `0 0 6px ${TRACK_COLORS[idx]}80`,
                  }}
                />
              ))}
            </div>
          ))}

          {/* Playhead */}
          <div className={s.playhead} style={{ left: `${playheadPct}%` }}>
            <div className={s.playheadHead} onMouseDown={e => {
              e.stopPropagation();
              const move = (me: MouseEvent) => {
                if (!trackRef.current) return;
                const rect = trackRef.current.getBoundingClientRect();
                const x = me.clientX - rect.left;
                const pct = Math.max(0, Math.min(1, x / rect.width));
                onTimeChange(pct * totalDuration);
              };
              const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
              window.addEventListener('mousemove', move);
              window.addEventListener('mouseup', up);
            }} />
            <div className={s.playheadLine} />
          </div>
        </div>
      </div>
    </div>
  );
}
