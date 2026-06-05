'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
const Link = ({ href, children, ...props }: any) => <RouterLink to={href} {...props}>{children}</RouterLink>;
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Plus, Clapperboard, ChevronDown, Zap } from 'lucide-react';
import { DeviceFrame } from '@/components/mockup/DeviceFrame';
import { useToastStore } from '@/lib/toast';
import { ALL_TOOLS } from '@/components/layout/Navbar';
import type { Transition } from 'framer-motion';
import {
  SceneScene, CameraState, Layer, BackgroundOption, AnimationPreset, EasingType,
  DeviceModel, FrameColor, FlowHotspot, TextLayer, TEXT_BLOCKS, FONT_PRESETS,
  DEFAULT_SCENES, DEFAULT_LAYERS, DEFAULT_CAMERA, BACKGROUNDS, MediaAsset
} from './types';

// Custom hook for localStorage persistence
function usePersistedState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save state to localStorage', e);
    }
  }, [key, state]);

  return [state, setState];
}
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import StudioTimeline from './StudioTimeline';
import KonvaStage, { type KonvaStageHandle } from './KonvaStage';
import { ExportDialog } from '@/components/export/ExportDialog';
import { ExportProgress } from '@/components/export/ExportProgress';
import { exportVideo } from '@/lib/export/videoExporter';
import { ExportSettings } from '@/lib/export/videoExporter';
import { KonvaExportRenderer } from '@/lib/export/KonvaExportRenderer';
import s from './page.module.css';

/* ─── Animation variant builder ──────────────────────────────────────────────
   ROTATION LIMITS (2D device pipeline):
     rotateX  ≤ ±4°   rotateY  ≤ ±5°   rotateZ  ≤ ±2°
   Motion philosophy: camera-first, cinematic, Apple-inspired — device stays
   legible at all times. No aggressive perspective skew or fake 3D orbiting.
─────────────────────────────────────────────────────────────────────────── */
function getVariants(animation: AnimationPreset, _easing: EasingType) {
  // Shared easing curves — all tuned for premium smoothness
  const APPLE_EASE = [0.25, 0.1, 0.25, 1] as [number, number, number, number];
  const CINEMA_EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];
  const SOFT_SPRING: Transition = { type: 'spring', stiffness: 60, damping: 18, mass: 1.1 };

  switch (animation) {
    /* ── 1. Static ─────────────────────────────────────────────── */
    case 'none':
      return {
        initial: { opacity: 1, x: 0, y: 0, scale: 1 },
        animate: { opacity: 1, x: 0, y: 0, scale: 1 },
        transition: { duration: 0 } as Transition,
      };

    /* ── 2. Floating Drift ────────────────────────────────────────
       Ultra-subtle levitation loop. Scale "breathes" slowly.
       Tilt kept to ±2° for a hint of depth without skew.         */
    case 'floating-drift':
      return {
        initial: { y: 0, scale: 1, rotateX: 0, rotateY: 0 },
        animate: {
          y: [-10, 10, -10],
          scale: [1, 1.012, 1],
          rotateX: [-1, 1, -1],
          rotateY: [-2, 2, -2],
        },
        transition: {
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.5, 1],
        } as Transition,
      };

    /* ── 3. Cinematic Push ────────────────────────────────────────
       Camera pushes in slowly. Device starts slightly further
       away (scale 0.94) and settles with micro-parallax drift.   */
    case 'cinematic-push':
      return {
        initial: { scale: 0.94, opacity: 0, y: 14 },
        animate: { scale: 1, opacity: 1, y: 0 },
        transition: {
          duration: 1.6,
          ease: CINEMA_EASE,
        } as Transition,
      };

    /* ── 4. Focus Pull ───────────────────────────────────────────
       Rack focus: blurry → sharp. Light scale shift simulates
       lens breathing. No rotation at all.                        */
    case 'focus-pull':
      return {
        initial: { filter: 'blur(16px)', opacity: 0, scale: 1.03 },
        animate: { filter: 'blur(0px)', opacity: 1, scale: 1 },
        transition: {
          duration: 1.4,
          ease: CINEMA_EASE,
        } as Transition,
      };

    /* ── 5. Hero Reveal ──────────────────────────────────────────
       Clean entrance: fade + gentle upward drift + scale 0.96→1.
       Blur clears as device arrives — mimics Apple keynote style.*/
    case 'hero-reveal':
      return {
        initial: { opacity: 0, y: 32, scale: 0.96, filter: 'blur(8px)' },
        animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
        transition: {
          duration: 1.2,
          ease: CINEMA_EASE,
        } as Transition,
      };

    /* ── 6. Ambient Motion ───────────────────────────────────────
       Designed for idle/demo loops. Near-imperceptible drift.
       rotateZ ≤ 1° — only enough to feel alive.                 */
    case 'ambient-motion':
      return {
        initial: { x: 0, y: 0, scale: 1, rotateZ: 0 },
        animate: {
          x: [-6, 6, -6],
          y: [-8, 4, -8],
          scale: [1, 1.008, 1],
          rotateZ: [-0.5, 0.5, -0.5],
        },
        transition: {
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.5, 1],
        } as Transition,
      };

    /* ── 7. Depth Parallax ───────────────────────────────────────
       Simulates multi-plane depth by drifting on Y with a slight
       scale breath. The camera (not the device) does the heavy
       lifting — zero rotation.                                   */
    case 'depth-parallax':
      return {
        initial: { y: 0, scale: 1, opacity: 0 },
        animate: {
          y: [-14, 14, -14],
          scale: [1, 1.018, 1],
          opacity: 1,
        },
        transition: {
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.5, 1],
          opacity: { duration: 0.6, ease: 'easeOut' },
        } as Transition,
      };

    /* ── 8. Camera Slide ─────────────────────────────────────────
       Horizontal pan entrance inspired by SaaS trailers.
       Device orientation stays perfectly stable — no tilt.      */
    case 'camera-slide':
      return {
        initial: { x: -80, opacity: 0, scale: 0.97 },
        animate: { x: 0, opacity: 1, scale: 1 },
        transition: {
          duration: 1.4,
          ease: APPLE_EASE,
        } as Transition,
      };

    /* ── 9. Precision Zoom ───────────────────────────────────────
       Smooth zoom-in for feature showcases. Scale from 0.88 →
       1 with a very soft spring landing. Zero rotation.         */
    case 'precision-zoom':
      return {
        initial: { scale: 0.88, opacity: 0, filter: 'blur(4px)' },
        animate: { scale: 1, opacity: 1, filter: 'blur(0px)' },
        transition: {
          ...SOFT_SPRING,
          opacity: { duration: 0.5, ease: 'easeOut' },
          filter: { duration: 0.6, ease: 'easeOut' },
        } as Transition,
      };

    default:
      return { initial: {}, animate: {}, transition: {} };
  }
}

function MediaPickerModal({
  library,
  onClose,
  onSelect,
  onDelete,
  onUpload
}: {
  library: MediaAsset[];
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  onDelete: (id: string) => void;
  onUpload: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 560, maxHeight: '80vh',
          background: 'linear-gradient(145deg, rgba(20,20,24,0.98) 0%, rgba(10,10,14,0.99) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(168,85,247,0.06)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(99,102,241,0.2))',
              border: '1px solid rgba(168,85,247,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>
                Media Library
              </h3>
              <p style={{ fontSize: '0.65rem', color: '#52525b', margin: 0, marginTop: 1 }}>
                {library.length} {library.length === 1 ? 'asset' : 'assets'} · Click to select
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 26, height: 26, borderRadius: 6,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#52525b', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, lineHeight: 1, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#52525b'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
          >×</button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '16px 20px 20px', flex: 1 }}>
          {/* Upload Button */}
          <button
            onClick={onUpload}
            style={{
              width: '100%', padding: '14px',
              background: 'rgba(255,255,255,0.02)',
              border: '1.5px dashed rgba(255,255,255,0.12)',
              borderRadius: 12, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              color: '#71717a', transition: 'all 0.2s', marginBottom: 16,
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = 'rgba(168,85,247,0.4)';
              el.style.background = 'rgba(168,85,247,0.05)';
              el.style.color = '#a855f7';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = 'rgba(255,255,255,0.12)';
              el.style.background = 'rgba(255,255,255,0.02)';
              el.style.color = '#71717a';
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={18} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Upload Media</span>
            <span style={{ fontSize: '0.62rem', opacity: 0.5 }}>Images, videos, GIFs</span>
          </button>

          {/* Media Grid */}
          {library.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {library.map(asset => (
                <div
                  key={asset.id}
                  style={{
                    position: 'relative', borderRadius: 10, overflow: 'hidden',
                    aspectRatio: '9/16', cursor: 'pointer',
                    border: '1.5px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.2s',
                    background: '#111',
                  }}
                  onClick={() => onSelect(asset)}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,85,247,0.5)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)';
                    const overlay = (e.currentTarget as HTMLElement).querySelector('.card-overlay') as HTMLElement;
                    if (overlay) overlay.style.opacity = '1';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    const overlay = (e.currentTarget as HTMLElement).querySelector('.card-overlay') as HTMLElement;
                    if (overlay) overlay.style.opacity = '0';
                  }}
                >
                  {asset.type === 'image' ? (
                    <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <video src={asset.url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} muted />
                  )}
                  {/* Hover overlay */}
                  <div
                    className="card-overlay"
                    style={{
                      position: 'absolute', inset: 0, opacity: 0, transition: 'opacity 0.2s',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                      padding: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {asset.type === 'video' && <Clapperboard size={10} style={{ color: '#d8b4fe' }} />}
                      <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.7)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {asset.name}
                      </span>
                    </div>
                  </div>
                  {/* Delete button */}
                  <button
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 22, height: 22, borderRadius: 6,
                      background: 'rgba(239,68,68,0.85)', backdropFilter: 'blur(8px)',
                      border: 'none', color: 'white', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0, transition: 'opacity 0.2s',
                    }}
                    className="card-delete"
                    onClick={e => { e.stopPropagation(); onDelete(asset.id); }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '32px 16px',
              color: '#3f3f46', fontSize: '0.75rem',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
              No media yet. Upload images or videos to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function CinematicStudioPage() {
  const { addToast } = useToastStore();

  // Tool switcher dropdown state
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Timeline resizer
  const [timelineHeight, setTimelineHeight] = useState(130);
  const isDraggingTimeline = useRef(false);

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('rendergpt_studio_onboarding');
    if (!hasSeen) {
      // Defer to next tick to avoid React cascading render warning
      setTimeout(() => setShowOnboarding(true), 0);
    }
  }, []);

  const dismissOnboarding = () => {
    localStorage.setItem('rendergpt_studio_onboarding', 'true');
    setShowOnboarding(false);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingTimeline.current) return;
      // Calculate new timeline height based on mouse Y position
      // window.innerHeight - e.clientY gives the distance from bottom
      const newHeight = Math.max(100, Math.min(window.innerHeight - e.clientY, window.innerHeight * 0.6));
      setTimelineHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (isDraggingTimeline.current) {
        isDraggingTimeline.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Scenes
  const [scenes, setScenes] = usePersistedState<SceneScene[]>('screenforge_anim_scenes', DEFAULT_SCENES);

  // Device
  const [device, setDevice] = usePersistedState<DeviceModel>('screenforge_anim_device', 'iphone-16-pro');
  const [frameColor, setFrameColor] = usePersistedState<FrameColor>('screenforge_anim_frameColor', 'black');
  const [background, setBackground] = usePersistedState<BackgroundOption>('screenforge_anim_background', BACKGROUNDS[0]);
  const [browserVariant, setBrowserVariant] = usePersistedState<any>('screenforge_anim_browserVariant', 'safari-light');

  // Layers
  const [layers, setLayers] = usePersistedState<Layer[]>('screenforge_anim_layers', DEFAULT_LAYERS);
  const [activeLayer, setActiveLayer] = useState('device');

  // Text Layers
  const [textLayers, setTextLayers] = usePersistedState<TextLayer[]>('screenforge_anim_texts', []);
  const [activeTextLayerId, setActiveTextLayerId] = useState<string | null>(null);
  const [editingTextLayerId, setEditingTextLayerId] = useState<string | null>(null);
  const [showTextBlockMenu, setShowTextBlockMenu] = useState(false);
  const textMenuContainerRef = useRef<HTMLDivElement>(null);

  // Media Library
  const [mediaLibrary, setMediaLibrary] = useState<MediaAsset[]>([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);


  const draggingLayerRef = useRef<string | null>(null);
  const dragStartRef = useRef<{ mx: number; my: number; sx: number; sy: number } | null>(null);
  const resizeLayerRef = useRef<string | null>(null);
  const resizeStartRef = useRef<{ mx: number; w: number } | null>(null);

  const handleTextLayerPointerDown = (e: React.PointerEvent, id: string) => {
    if (isExporting) return;
    e.stopPropagation();
    setActiveTextLayerId(id);
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingLayerRef.current = id;
    const layer = textLayers.find(l => l.id === id);
    if (!layer) return;
    dragStartRef.current = { mx: e.clientX, my: e.clientY, sx: layer.x, sy: layer.y };
  };

  const handleTextLayerPointerMove = (e: React.PointerEvent) => {
    if (!draggingLayerRef.current || !dragStartRef.current) return;
    const dx = (e.clientX - dragStartRef.current.mx) / window.innerWidth * 100;
    const dy = (e.clientY - dragStartRef.current.my) / window.innerHeight * 100;
    let newX = dragStartRef.current.sx + dx;
    let newY = dragStartRef.current.sy + dy;
    updateTextLayer(draggingLayerRef.current, { x: newX, y: newY });
  };

  const handleTextLayerPointerUp = (e: React.PointerEvent) => {
    if (draggingLayerRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      draggingLayerRef.current = null;
      dragStartRef.current = null;
    }
  };

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
    const totalSceneDur = scenes.reduce((sum, sc) => sum + sc.duration, 0);
    // Clamp duration so it doesn't exceed total animation duration
    const maxDur = Math.max(1, totalSceneDur - currentTime);
    const dur = Math.min(3, maxDur);

    const newLayer: TextLayer = {
      id, type: block.type ?? 'caption', text: block.text ?? '',
      x: 50, y: 50, width: 700, align: 'center',
      fontFamily: FONT_PRESETS[0].font, fontPreset: 'modern',
      fontSize: block.fontSize ?? 20, fontWeight: block.fontWeight ?? 400,
      letterSpacing: block.letterSpacing ?? 0, lineHeight: block.lineHeight ?? 1.4,
      color: block.color ?? '#ffffff', opacity: block.opacity ?? 100, glow: block.glow ?? 0,
      gradient: block.gradient ?? false, gradientFrom: '#a855f7', gradientTo: '#6366f1',
      shadow: false, zIndex: textLayers.length + 10,
      startTime: currentTime,
      duration: dur,
      animationIn: block.animationIn ?? 'fade'
    };
    setTextLayers(prev => [...prev, newLayer]);
    setActiveTextLayerId(id);
    setShowTextBlockMenu(false);
  };

  const updateTextLayer = (id: string, updates: Partial<TextLayer>) => {
    setTextLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Video Export
  const [isExporting, setIsExporting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportPhase, setExportPhase] = useState<'rendering' | 'encoding' | null>(null);
  const [exportProgressVal, setExportProgressVal] = useState(0);
  const [exportCurrentFrame, setExportCurrentFrame] = useState(0);
  const [exportTotalFrames, setExportTotalFrames] = useState(0);
  const [exportError, setExportError] = useState<string | undefined>(undefined);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]); 

  // Ref for the canvas viewport DOM element — used by the DOM-capture exporter
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);

  // Konva stage ref — used by KonvaExportRenderer when ?konva=1 is in the URL
  const konvaStageRef = useRef<KonvaStageHandle | null>(null);

  // Toggle: add ?konva=1 to the URL to activate the Konva rendering pipeline
  const useKonvaMode = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('konva') === '1';

  const totalDuration = useMemo(
    () => scenes.reduce((sum, sc) => sum + sc.duration, 0),
    [scenes]
  );

  // Derive which scene is active from currentTime — no effect needed
  const activeSceneId = useMemo(() => {
    let acc = 0;
    for (const sc of scenes) {
      acc += sc.duration;
      if (currentTime < acc) return sc.id;
    }
    return scenes[scenes.length - 1].id;
  }, [currentTime, scenes]);

  const activeScene = scenes.find(sc => sc.id === activeSceneId) ?? scenes[0];

  // Camera is derived from the active scene — no separate state needed
  const camera = activeScene.camera;

  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      const tick = (now: number) => {
        const dt = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;
        setCurrentTime(t => {
          const next = t + dt;
          if (next >= totalDuration) { setIsPlaying(false); return totalDuration; }
          return next;
        });
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, totalDuration]);

  // Handle Export Completion
  useEffect(() => {
    if (isExporting && !isPlaying && currentTime >= totalDuration) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  }, [isPlaying, currentTime, isExporting, totalDuration]);

  // No effect needed — activeSceneId is derived from currentTime above

  const handlePlayPause = useCallback(() => {
    if (currentTime >= totalDuration) { setCurrentTime(0); setAnimKey(k => k + 1); }
    setIsPlaying(p => !p);
  }, [currentTime, totalDuration]);

  const handleRestart = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setAnimKey(k => k + 1);
  }, []);

  // Seek currentTime to a scene's start offset — this is the correct way
  // to "switch" scenes (activeSceneId derives from currentTime)
  const handleSceneSeek = useCallback((id: string) => {
    let acc = 0;
    for (const sc of scenes) {
      if (sc.id === id) break;
      acc += sc.duration;
    }
    setCurrentTime(acc);
    setActiveTextLayerId(null);
    setAnimKey(k => k + 1);
  }, [scenes]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      const newAsset: MediaAsset = {
        id: Math.random().toString(36).substring(7),
        type: 'image',
        url: dataUrl,
        name: file.name
      };
      setMediaLibrary(prev => [newAsset, ...prev]);
      setScenes(prev => prev.map(sc => sc.id === activeScene.id ? { ...sc, image: dataUrl } : sc));
      addToast('Screenshot loaded ✓', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string;
        const newAsset: MediaAsset = {
          id: Math.random().toString(36).substring(7),
          type: 'image',
          url: dataUrl,
          name: file.name
        };
        setMediaLibrary(prev => [newAsset, ...prev]);
        setScenes(prev => prev.map(sc => sc.id === activeScene.id ? { ...sc, image: dataUrl } : sc));
      };
      reader.readAsDataURL(file);
    } else if (file?.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string;
        const tmpVid = document.createElement('video');
        tmpVid.preload = 'metadata';
        tmpVid.onloadedmetadata = () => {
          const dur = Math.round(tmpVid.duration * 10) / 10;
          URL.revokeObjectURL(tmpVid.src);
          const sceneId = activeScene.id;
          const newAsset: MediaAsset = {
            id: Math.random().toString(36).substring(7),
            type: 'video',
            url: dataUrl,
            name: file.name
          };
          setMediaLibrary(prev => [newAsset, ...prev]);
          setScenes(prev => prev.map(sc => sc.id === sceneId
            ? { ...sc, video: dataUrl, mode: 'video', duration: dur, scrollSpeed: dur,
                videoDuration: dur, videoTrimStart: 0, videoTrimEnd: dur }
            : sc
          ));
          addToast(`Video cargado ✓  (${dur}s)`, 'success');
        };
        tmpVid.src = URL.createObjectURL(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const tmpVid = document.createElement('video');
    tmpVid.preload = 'metadata';
    tmpVid.onloadedmetadata = () => {
      const dur = Math.round(tmpVid.duration * 10) / 10;
      URL.revokeObjectURL(tmpVid.src);
      const reader = new FileReader();
      const sceneId = activeScene.id;
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string;
        const newAsset: MediaAsset = {
          id: Math.random().toString(36).substring(7),
          type: 'video',
          url: dataUrl,
          name: file.name
        };
        setMediaLibrary(prev => [newAsset, ...prev]);
        setScenes(prev => prev.map(sc => sc.id === sceneId
          ? { ...sc, video: dataUrl, mode: 'video', duration: dur, scrollSpeed: dur,
              videoDuration: dur, videoTrimStart: 0, videoTrimEnd: dur }
          : sc
        ));
        addToast(`Video cargado ✓  (${dur}s)`, 'success');
      };
      reader.readAsDataURL(file);
    };
    tmpVid.src = URL.createObjectURL(file);
    e.target.value = '';
  };


  const handleRemoveMedia = () => {
    const id = activeScene.id;
    if (activeScene.mode === 'video') {
      setScenes(prev => prev.map(sc => sc.id === id
        ? { ...sc, video: undefined, mode: 'animation' as const }
        : sc
      ));
      addToast('Video removed', 'success');
    } else {
      setScenes(prev => prev.map(sc => sc.id === id
        ? { ...sc, image: undefined }
        : sc
      ));
      addToast('Image removed', 'success');
    }
  };

  const handleExportVideo = () => {
    setShowExportDialog(true);
  };

  const executeExport = async (settings: Omit<ExportSettings, 'stage' | 'onSeekFrame' | 'onProgress'>) => {
    // ── Konva path ────────────────────────────────────────────────────────────
    const konvaStage = konvaStageRef.current?.stage;
    if (useKonvaMode && konvaStage) {
      setShowExportDialog(false);
      setExportPhase('rendering');
      setExportProgressVal(0);
      setExportError(undefined);
      setIsExporting(true);

      const renderer = new KonvaExportRenderer(konvaStage);

      // Build a synthetic ExportSettings with a fake canvasElement so we can
      // reuse the existing exportVideo loop — only the renderer changes.
      const { width, height, fps, duration, quality } = settings;
      const totalFrames = Math.floor(duration * fps);

      try {
        // Import FFmpeg lazily (same as videoExporter.ts)
        const { getFFmpeg } = await import('@/lib/export/ffmpeg');
        const ffmpeg = await getFFmpeg();

        let crf = '23';
        if (quality === 'High')  crf = '18';
        if (quality === 'Ultra') crf = '14';

        for (let i = 0; i < totalFrames; i++) {
          const time = i / fps;
          setCurrentTime(time);
          // Wait two rAFs for Konva to repaint
          await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));

          const blob = await renderer.captureFrame();
          const arrayBuffer = await blob.arrayBuffer();
          const fileName = `frame_${String(i).padStart(4, '0')}.png`;
          await ffmpeg.writeFile(fileName, new Uint8Array(arrayBuffer));

          setExportPhase('rendering');
          setExportProgressVal((i + 1) / totalFrames);
          setExportCurrentFrame(i + 1);
          setExportTotalFrames(totalFrames);

          await new Promise(r => setTimeout(r, 0));
        }

        setExportPhase('encoding');
        ffmpeg.on('progress', ({ progress }) => {
          setExportProgressVal(Math.max(0, Math.min(1, progress ?? 0)));
        });

        await ffmpeg.exec([
          '-framerate', String(fps),
          '-i', 'frame_%04d.png',
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          '-preset', 'ultrafast',
          '-crf', crf,
          '-vf', `scale=${width}:${height}:flags=lanczos`,
          'output.mp4',
        ]);

        const data = await ffmpeg.readFile('output.mp4');
        const mp4Blob = new Blob([data as unknown as ArrayBuffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(mp4Blob);

        // Cleanup ffmpeg FS
        for (let i = 0; i < totalFrames; i++) {
          try { await ffmpeg.deleteFile(`frame_${String(i).padStart(4, '0')}.png`); } catch {}
        }
        try { await ffmpeg.deleteFile('output.mp4'); } catch {}

        const a = document.createElement('a');
        a.href = url;
        a.download = `screenforge-export-${Date.now()}.mp4`;
        a.click();
        URL.revokeObjectURL(url);
        addToast('Video exported successfully! (Konva)', 'success');
        setIsExporting(false);
        setExportPhase(null);
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setExportError(msg);
        setExportPhase(null);
        setIsExporting(false);
        return;
      }
    }

    // ── Legacy DOM path (html2canvas) ────────────────────────────────────────
    if (!canvasViewportRef.current) {
      addToast('Canvas not ready for export', 'error');
      return;
    }

    setShowExportDialog(false);
    setExportPhase('rendering');
    setExportProgressVal(0);
    setExportError(undefined);
    setIsExporting(true);

    // Snapshot the element reference before the async loop
    if (!konvaStageRef.current?.stage) { addToast('Error: Stage not ready', 'error'); setIsExporting(false); return; }
    console.log('[page] executeExport: starting export');

    try {
      const url = await exportVideo({
        ...settings,
        stage: konvaStageRef.current?.stage!,
        // Called for each frame — advances the timeline so React re-renders.
        // Do NOT increment animKey here: that remounts the motion.div every frame,
        // preventing scene 2 from ever appearing in the export.
        onSeekFrame: (time: number) => {
          setCurrentTime(time);
        },
        onProgress: (phase, progress, cur, tot) => {
          setExportPhase(phase);
          setExportProgressVal(progress);
          if (cur !== undefined) setExportCurrentFrame(cur);
          if (tot !== undefined) setExportTotalFrames(tot);
        },
      });

      const a = document.createElement('a');
      a.href = url;
      a.download = `screenforge-export-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Video exported successfully!', 'success');
      setIsExporting(false);
      setExportPhase(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[page] Export error:', err);
      // Keep the ExportProgress modal open — switch it to error state
      setExportError(msg);
      setExportPhase(null);
      setIsExporting(false);
    }
  };

  const updateScene = useCallback((id: string, patch: Partial<SceneScene>) => {
    setScenes(prev => prev.map(sc => sc.id === id ? { ...sc, ...patch } : sc));
  }, []);

  const handleVideoTrimChange = useCallback((start: number, end: number) => {
    const clampedStart = Math.max(0, start);
    const clampedEnd = end;
    const clipLength = clampedEnd - clampedStart;
    setScenes(prev => prev.map(sc => {
      if (sc.id !== activeSceneId) return sc;
      const rate = sc.videoPlaybackRate ?? 1;
      const newDuration = Math.max(0.5, Math.round((clipLength / rate) * 10) / 10);
      return {
        ...sc,
        videoTrimStart: clampedStart,
        videoTrimEnd: clampedEnd,
        duration: newDuration,
        scrollSpeed: newDuration,
      };
    }));
  }, [activeSceneId]);

  const addScene = useCallback(() => {
    const id = `s${Date.now()}`;
    const colors = ['#f59e0b', '#ec4899', '#14b8a6', '#f97316'];
    const newScene: SceneScene = {
      id,
      name: `Scene ${scenes.length + 1}`,
      duration: 3,
      animationPreset: 'floating-drift',
      easing: 'spring',
      camera: { ...DEFAULT_CAMERA },
      color: colors[scenes.length % colors.length],
      scrollSpeed: 6,
      mode: 'animation' as const,
      hotspots: [],
    };
    // Seek to the new scene's start so activeSceneId derives correctly
    const newOffset = scenes.reduce((s, sc) => s + sc.duration, 0);
    setScenes(prev => [...prev, newScene]);
    setCurrentTime(newOffset);
    setAnimKey(k => k + 1);
  }, [scenes]);

  // Camera updates go directly onto the scene; camera is derived, not stored separately
  const handleCameraChange = useCallback((patch: Partial<CameraState>) => {
    const merged = { ...camera, ...patch };
    updateScene(activeSceneId, { camera: merged });
  }, [camera, activeSceneId, updateScene]);

  const handleLayerToggle = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const handleDeviceScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (false /* flow mode removed */) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      const newHotspot: FlowHotspot = {
        id: `h${Date.now()}`,
        x, y,
        label: `Link`,
        action: 'none',
      };
      updateScene(activeSceneId, { 
        hotspots: [...(activeScene.hotspots ?? []), newHotspot] 
      });
    } else if (activeScene.mode === 'video') {
      videoFileInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const deviceScale = device === 'macbook-pro' ? 55 : device === 'browser' ? 58 : 65;

  return (
    <div className={s.studio}>
      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div 
            className={s.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={s.modalContent}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
            >
              <div className={s.modalHeader}>
                <div className={s.modalIcon}><Clapperboard size={20} /></div>
                <h2>Bienvenido a Cinematic Studio</h2>
              </div>
              <div className={s.modalBody}>
                <p>Bienvenido a tu estudio profesional de animación 3D. Aquí tienes algunos consejos rápidos:</p>
                <ul>
                  <li><strong>3 Escenas por defecto:</strong> Tu proyecto comienza con tres ángulos de cámara distintos para crear una secuencia dinámica.</li>
                  <li><strong>Cámara Virtual:</strong> Cada escena tiene controles independientes de Paneos, Zoom e Inclinación.</li>
                  <li><strong>Animaciones:</strong> Aplica movimientos de entrada o continuos (como "Flotar") por cada escena de forma individual.</li>
                  <li><strong>Línea de tiempo:</strong> Arrastra la barra divisoria para ajustar la altura, y haz clic en las escenas para visualizar las transiciones.</li>
                </ul>
              </div>
              <div className={s.modalFooter}>
                <button className={s.btnPrimary} onClick={dismissOnboarding}>Entendido, ¡A crear!</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Bar ── */}
      <div className={s.topBar}>
        <div className={s.topBarLeft}>
          <Link href="/" className={s.logoLink}>
            <Zap style={{ width: 14, height: 14, color: 'var(--primary)' }} />
          </Link>
          <div className={s.topDivider} />

          <div className={s.switcherContainer} ref={dropdownRef}>
            <button className={s.switcherTrigger} onClick={() => setSwitcherOpen(!switcherOpen)}>
              <div className={s.toolIcon}>
                <Clapperboard style={{ width: 12, height: 12, color: 'white' }} />
              </div>
              <div className={s.titleBlock}>
                <h1 className={s.title}>Device Animation</h1>
                <ChevronDown className={`${s.chevron} ${switcherOpen ? s.chevronOpen : ''}`} />
              </div>
            </button>
            
            <AnimatePresence>
              {switcherOpen && (
                <motion.div
                  className={s.switcherDropdown}
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                >
                  {ALL_TOOLS.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className={`${s.switcherItem} ${tool.name === 'Device Animation' ? s.activeItem : ''}`}
                      onClick={() => setSwitcherOpen(false)}
                    >
                      <div className={s.switcherItemIcon}>
                        <tool.icon style={{ width: 12, height: 12 }} />
                      </div>
                      <div className={s.switcherItemMeta}>
                        <div className={s.switcherItemName}>{tool.name}</div>
                        <div className={s.switcherItemDesc}>{tool.desc}</div>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Scene Tabs */}
        <div className={s.topBarCenter}>
          <div className={s.sceneTabsBar}>
            {scenes.map(sc => (
              <button
                key={sc.id}
                className={`${s.sceneTab} ${sc.id === activeSceneId ? s.sceneTabActive : ''}`}
                onClick={() => handleSceneSeek(sc.id)}
              >
                <div className={s.sceneTabDot} style={{ background: sc.color }} />
                {sc.name}
                <span style={{ opacity: 0.45, fontSize: '0.58rem' }}>{sc.duration}s</span>
              </button>
            ))}
            <button className={s.addSceneBtn} onClick={addScene} title="Add scene">+</button>
          </div>

          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />

          {/* Add Text Menu */}
          <div style={{ position: 'relative' }} ref={textMenuContainerRef}>
            <button
              className={s.addTextBtn}
              onClick={() => setShowTextBlockMenu(v => !v)}
            >
              <Plus size={10} style={{ display: 'inline', marginRight: 2 }} />
              Add Text
            </button>

            <AnimatePresence>
              {showTextBlockMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={s.textBlockMenu}
                >
                  <div className={s.textBlockMenuTitle}>TEXT BLOCKS</div>
                  {TEXT_BLOCKS.map(block => (
                    <button
                      key={block.id}
                      className={s.textBlockMenuItem}
                      onClick={() => addTextBlock(block)}
                    >
                      <div className={s.textBlockPreview} style={{
                        fontWeight: block.fontWeight,
                        fontSize: Math.max(10, (block.fontSize ?? 20) * 0.18),
                        letterSpacing: (block.letterSpacing ?? 0) * 0.3,
                        color: block.gradient ? 'transparent' : block.color,
                        backgroundImage: block.gradient ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'none',
                        WebkitBackgroundClip: block.gradient ? 'text' : 'border-box',
                        backgroundClip: block.gradient ? 'text' : 'border-box',
                      }}>{(block.text ?? '').split('\n')[0]}</div>
                      <div className={s.textBlockLabel}>{block.type}</div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className={s.topBarRight}>
          <button
            className={s.topBtn}
            onClick={() => { setAnimKey(k => k + 1); addToast('Animation replayed', 'info'); }}
          >
            ↺ Replay
          </button>
          <button
            className={s.exportBtn}
            onClick={handleExportVideo}
            disabled={isExporting}
          >
            {isExporting ? <div className={s.recordDot} /> : <Download size={11} />}
            {isExporting ? 'Recording...' : 'Export'}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className={s.body}>
        {/* Left Sidebar */}
        <div className={s.leftSidebar}>
          <LeftSidebar
            device={device}
            frameColor={frameColor}
            background={background}
            camera={camera}
            layers={layers}
            activeLayer={activeLayer}
            onDevice={setDevice}
            onFrameColor={setFrameColor}
            onBackground={setBackground}
            onCamera={handleCameraChange}
            onLayerSelect={setActiveLayer}
            onLayerToggle={handleLayerToggle}
            browserVariant={browserVariant}
            onBrowserVariant={setBrowserVariant}
          />
        </div>

        {/* Center Canvas */}
        <div className={s.canvasArea}>
          {/* ── Konva Mode (activate with ?konva=1 in URL) ── */}
          {useKonvaMode ? (
            <div
              className={s.canvasViewport}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              {/* Mode badge */}
              <div data-export-hide="true" style={{
                position: 'absolute', top: 8, right: 8, zIndex: 100,
                background: 'rgba(124,58,237,0.9)', color: 'white',
                fontSize: 10, fontWeight: 700, padding: '2px 8px',
                borderRadius: 4, letterSpacing: 0.5, pointerEvents: 'none',
              }}>
                ⚡ KONVA
              </div>

              <KonvaStage
                ref={konvaStageRef}
                activeScene={activeScene}
                scenes={scenes}
                isPlaying={isPlaying}
                currentTime={currentTime}
                device={device}
                frameColor={frameColor}
                deviceScale={deviceScale}
                background={background}
                browserVariant={browserVariant}
                layers={layers}
                camera={camera}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
                handleDrop={handleDrop}
                handleDeviceScreenClick={handleDeviceScreenClick}
                handleSceneSeek={handleSceneSeek}
                handlePlayPause={handlePlayPause}
                addScene={addScene}
                animKey={animKey}
                textLayers={textLayers}
                activeTextLayerId={activeTextLayerId}
                editingTextLayerId={editingTextLayerId}
                setActiveTextLayerId={setActiveTextLayerId}
                setEditingTextLayerId={setEditingTextLayerId}
                updateTextLayer={updateTextLayer}
                isExporting={isExporting}
                videoFileInputRef={videoFileInputRef}
                handleVideoFileChange={handleVideoFileChange}
                onRemoveMedia={handleRemoveMedia}
                onAddMediaClick={() => setShowMediaPicker(true)}
              />
            </div>
          ) : (
            /* ── Legacy DOM Mode (default) ── */
            <div
              ref={canvasViewportRef}
              className={s.canvasViewport}
              style={background.style}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div className={s.canvasGrid} data-export-hide="true" />

              {/* Virtual Camera Stage & Overlays */}
              <KonvaStage
                ref={konvaStageRef}
                activeScene={activeScene}
                scenes={scenes}
                isPlaying={isPlaying}
                currentTime={currentTime}
                device={device}
                frameColor={frameColor}
                deviceScale={deviceScale}
                background={background}
                browserVariant={browserVariant}
                layers={layers}
                camera={camera}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
                handleDrop={handleDrop}
                handleDeviceScreenClick={handleDeviceScreenClick}
                handleSceneSeek={handleSceneSeek}
                handlePlayPause={handlePlayPause}
                addScene={addScene}
                animKey={animKey}
                textLayers={textLayers}
                activeTextLayerId={activeTextLayerId}
                editingTextLayerId={editingTextLayerId}
                setActiveTextLayerId={setActiveTextLayerId}
                setEditingTextLayerId={setEditingTextLayerId}
                updateTextLayer={updateTextLayer}
                isExporting={isExporting}
                videoFileInputRef={videoFileInputRef}
                handleVideoFileChange={handleVideoFileChange}
                onRemoveMedia={handleRemoveMedia}
                onAddMediaClick={() => setShowMediaPicker(true)}
              />
            </div>
          )}

          {/* Timeline */}
          <div 
            className={s.timelineResizer}
            onMouseDown={() => {
              isDraggingTimeline.current = true;
              document.body.style.cursor = 'row-resize';
              document.body.style.userSelect = 'none';
            }}
          />
          <div style={{ height: timelineHeight, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <StudioTimeline
              scenes={scenes}
              activeSceneId={activeSceneId}
              currentTime={currentTime}
              isPlaying={isPlaying}
              totalDuration={totalDuration}
              textLayers={textLayers}
              activeTextLayerId={activeTextLayerId}
              setActiveTextLayerId={setActiveTextLayerId}
              deleteTextLayer={(id) => {
                setTextLayers(prev => prev.filter(l => l.id !== id));
                if (activeTextLayerId === id) setActiveTextLayerId(null);
              }}
              updateTextLayer={updateTextLayer}
              onSelectScene={handleSceneSeek}
              onTimeChange={t => { setCurrentTime(t); setIsPlaying(false); }}
              onPlayPause={handlePlayPause}
              onRestart={handleRestart}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={s.rightSidebar}>
          <RightSidebar
            scene={activeScene}
            scenes={scenes}
            textLayers={textLayers}
            activeTextLayerId={activeTextLayerId}
            setActiveTextLayerId={setActiveTextLayerId}
            setTextLayers={setTextLayers}
            updateTextLayer={updateTextLayer}
            deleteTextLayer={(id) => {
              setTextLayers(prev => prev.filter(l => l.id !== id));
              if (activeTextLayerId === id) setActiveTextLayerId(null);
            }}
            onModeChange={m => updateScene(activeSceneId, { mode: m })}
            onAnimationChange={a => { updateScene(activeSceneId, { animationPreset: a }); setAnimKey(k => k + 1); }}
            onEasingChange={e => updateScene(activeSceneId, { easing: e })}
            onDurationChange={d => updateScene(activeSceneId, { duration: d })}
            
            onScrollSpeedChange={sp => updateScene(activeSceneId, { scrollSpeed: sp })}
            
            
            onVideoPlaybackRateChange={r => {
              setScenes(prev => prev.map(sc => {
                if (sc.id !== activeSceneId) return sc;
                const trimStart = sc.videoTrimStart ?? 0;
                const trimEnd = sc.videoTrimEnd ?? sc.videoDuration ?? sc.duration;
                const clipLength = (trimEnd ?? sc.duration) - trimStart;
                const newDuration = Math.max(0.5, Math.round((clipLength / r) * 10) / 10);
                return { ...sc, videoPlaybackRate: r, duration: newDuration, scrollSpeed: newDuration };
              }));
            }}
            onVideoTrimChange={handleVideoTrimChange}
            videoFileInputRef={videoFileInputRef}
            onHotspotUpdate={(hId, updates) => {
              const hotspots = activeScene.hotspots || [];
              updateScene(activeSceneId, {
                hotspots: hotspots.map(h => h.id === hId ? { ...h, ...updates } : h)
              });
            }}
            onHotspotDelete={id => {
              const hs = (activeScene.hotspots ?? []).filter(h => h.id !== id);
              updateScene(activeSceneId, { hotspots: hs });
            }}
            onSceneRename={name => updateScene(activeSceneId, { name })}
            onSceneDelete={() => {
              if (scenes.length <= 1) {
                addToast('Cannot delete the last scene', 'error');
                return;
              }
              const newScenes = scenes.filter(s => s.id !== activeSceneId);
              setScenes(newScenes);
              // reset time to 0 to be safe
              setCurrentTime(0);
              setAnimKey(k => k + 1);
            }}
          />
        </div>
      </div>

      {showExportDialog && (
        <ExportDialog
          onClose={() => setShowExportDialog(false)}
          onExport={executeExport}
          duration={totalDuration}
        />
      )}

      {(exportPhase || exportError) && (
        <ExportProgress
          phase={exportPhase}
          progress={exportProgressVal}
          currentFrame={exportCurrentFrame}
          totalFrames={exportTotalFrames}
          errorMessage={exportError}
          onDismissError={() => setExportError(undefined)}
        />
      )}

      {showMediaPicker && (
        <MediaPickerModal
          library={mediaLibrary}
          onClose={() => setShowMediaPicker(false)}
          onSelect={(asset) => {
            const id = activeScene.id;
            if (asset.type === 'video') {
              const tmpVid = document.createElement('video');
              tmpVid.preload = 'metadata';
              tmpVid.onloadedmetadata = () => {
                const dur = Math.round(tmpVid.duration * 10) / 10;
                setScenes(prev => prev.map(sc => sc.id === id
                  ? { ...sc, video: asset.url, image: undefined, mode: 'video', duration: dur, scrollSpeed: dur, videoDuration: dur, videoTrimStart: 0, videoTrimEnd: dur }
                  : sc
                ));
              };
              tmpVid.src = asset.url;
            } else {
              setScenes(prev => prev.map(sc => sc.id === id ? { ...sc, image: asset.url, video: undefined, mode: 'animation' as const } : sc));
            }
            setShowMediaPicker(false);
          }}
          onDelete={(assetId) => {
            setMediaLibrary(prev => prev.filter(a => a.id !== assetId));
            // Also remove from scenes if it's currently used
            const assetToRemove = mediaLibrary.find(a => a.id === assetId);
            if (assetToRemove) {
              setScenes(prev => prev.map(sc => {
                if (sc.image === assetToRemove.url) return { ...sc, image: undefined };
                if (sc.video === assetToRemove.url) return { ...sc, video: undefined, mode: 'animation' as const };
                return sc;
              }));
            }
          }}
          onUpload={() => {
            // trigger normal file upload
            fileInputRef.current?.click();
          }}
        />
      )}
    </div>
  );
}
