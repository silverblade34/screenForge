'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Type } from 'lucide-react';
import { SceneScene, TextLayer } from './types';
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
  textLayers?: TextLayer[];
  activeTextLayerId?: string | null;
  setActiveTextLayerId?: (id: string | null) => void;
  deleteTextLayer?: (id: string) => void;
  updateTextLayer?: (id: string, updates: Partial<TextLayer>) => void;
}

const TRACK_COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function StudioTimeline({
  scenes, activeSceneId, currentTime, isPlaying,
  totalDuration, onSelectScene, onTimeChange, onPlayPause, onRestart,
  textLayers = [], activeTextLayerId, setActiveTextLayerId, deleteTextLayer, updateTextLayer
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
          {textLayers.map((l, i) => (
            <div key={l.id} className={s.tlLabel} style={{ color: TRACK_COLORS[i % TRACK_COLORS.length] }}>
              Text {i + 1}
            </div>
          ))}
          {textLayers.length === 0 && (
            <div className={s.tlLabel} style={{ opacity: 0.5, fontStyle: 'italic' }}>No texts</div>
          )}
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

          {/* Track rows (One per text layer) */}
          {textLayers.map((layer, idx) => {
            const left = totalDuration > 0 ? ((layer.startTime ?? 0) / totalDuration) * 100 : 0;
            const width = totalDuration > 0 ? ((layer.duration ?? 3) / totalDuration) * 100 : 0;
            const isActive = activeTextLayerId === layer.id;
            const color = TRACK_COLORS[idx % TRACK_COLORS.length];
            return (
              <div key={layer.id} className={s.trackRow}>
                <div
                  className={s.trackClip}
                  onMouseDown={(e) => {
                    if (e.button !== 0 || e.ctrlKey) return; // Only drag on left click
                    // Si no estamos haciendo clic en un resize handle, seleccionamos y preparamos arrastre
                    if (!(e.target as HTMLElement).className.includes('resizeHandle')) {
                      setActiveTextLayerId?.(layer.id);
                      e.preventDefault();
                      if (!trackRef.current) return;
                      const rect = trackRef.current.getBoundingClientRect();
                      const initialStartTime = layer.startTime ?? 0;
                      const startX = e.clientX;
                      
                      const move = (me: MouseEvent) => {
                        const dx = me.clientX - startX;
                        const dt = (dx / rect.width) * totalDuration;
                        let newStartTime = initialStartTime + dt;
                        const duration = layer.duration ?? 3;
                        newStartTime = Math.max(0, Math.min(newStartTime, totalDuration - duration));
                        updateTextLayer?.(layer.id, { startTime: newStartTime });
                      };
                      const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                      window.addEventListener('mousemove', move);
                      window.addEventListener('mouseup', up);
                    }
                  }}
                  style={{
                    left: `${left}%`,
                    width: `calc(${width}% - 2px)`,
                    background: isActive ? `${color}33` : `${color}18`,
                    border: `1px solid ${isActive ? color : color + '60'}`,
                    color: color,
                    cursor: 'pointer',
                    zIndex: isActive ? 10 : 1,
                    position: 'absolute'
                  }}
                >
                  <Type size={10} style={{ marginRight: 4, display: 'inline', pointerEvents: 'none' }} />
                  <span style={{ pointerEvents: 'none' }}>{layer.text.substring(0, 15)}...</span>
                  
                  {/* Left Resize Handle */}
                  <div
                    className="resizeHandle"
                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, cursor: 'ew-resize' }}
                    onMouseDown={(e) => {
                      if (e.button !== 0 || e.ctrlKey) return;
                      e.stopPropagation();
                      e.preventDefault();
                      setActiveTextLayerId?.(layer.id);
                      if (!trackRef.current) return;
                      const rect = trackRef.current.getBoundingClientRect();
                      const initialStartTime = layer.startTime ?? 0;
                      const initialDuration = layer.duration ?? 3;
                      
                      const move = (me: MouseEvent) => {
                        const x = me.clientX - rect.left;
                        const pct = Math.max(0, Math.min(1, x / rect.width));
                        const newStartTime = pct * totalDuration;
                        const diff = newStartTime - initialStartTime;
                        const newDuration = Math.max(0.1, initialDuration - diff);
                        
                        if (newStartTime < initialStartTime + initialDuration - 0.1) {
                          updateTextLayer?.(layer.id, { startTime: newStartTime, duration: newDuration });
                        }
                      };
                      const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                      window.addEventListener('mousemove', move);
                      window.addEventListener('mouseup', up);
                    }}
                  />
                  
                  {/* Right Resize Handle */}
                  <div
                    className="resizeHandle"
                    style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 8, cursor: 'ew-resize' }}
                    onMouseDown={(e) => {
                      if (e.button !== 0 || e.ctrlKey) return;
                      e.stopPropagation();
                      e.preventDefault();
                      setActiveTextLayerId?.(layer.id);
                      if (!trackRef.current) return;
                      const rect = trackRef.current.getBoundingClientRect();
                      const initialStartTime = layer.startTime ?? 0;
                      
                      const move = (me: MouseEvent) => {
                        const x = me.clientX - rect.left;
                        const pct = Math.max(0, Math.min(1, x / rect.width));
                        const newEndTime = pct * totalDuration;
                        const newDuration = Math.max(0.1, newEndTime - initialStartTime);
                        updateTextLayer?.(layer.id, { duration: newDuration });
                      };
                      const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                      window.addEventListener('mousemove', move);
                      window.addEventListener('mouseup', up);
                    }}
                  />
                </div>
              </div>
            );
          })}
          {textLayers.length === 0 && (
            <div className={s.trackRow} style={{ borderBottom: 'none' }} />
          )}

          {/* Playhead */}
          <div className={s.playhead} style={{ left: `${playheadPct}%` }}>
            <div className={s.playheadLine} />
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
