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
  DeviceModel, FrameColor,
  DEFAULT_SCENES, DEFAULT_LAYERS, DEFAULT_CAMERA, BACKGROUNDS,
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
import CanvasArea from './CanvasArea';
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
  const [frameColor, setFrameColor] = usePersistedState<FrameColor>('screenforge_anim_frameColor', 'spaceBlack');
  const [background, setBackground] = usePersistedState<BackgroundOption>('screenforge_anim_background', BACKGROUNDS[0]);

  // Layers
  const [layers, setLayers] = usePersistedState<Layer[]>('screenforge_anim_layers', DEFAULT_LAYERS);
  const [activeLayer, setActiveLayer] = useState('device');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

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
    setAnimKey(k => k + 1);
  }, [scenes]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
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
        setScenes(prev => prev.map(sc => sc.id === activeScene.id ? { ...sc, image: dataUrl } : sc));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateScene = useCallback((id: string, patch: Partial<SceneScene>) => {
    setScenes(prev => prev.map(sc => sc.id === id ? { ...sc, ...patch } : sc));
  }, []);

  const addScene = useCallback(() => {
    const id = `s${Date.now()}`;
    const colors = ['#f59e0b', '#ec4899', '#14b8a6', '#f97316'];
    const newScene: SceneScene = {
      id,
      name: `Scene ${scenes.length + 1}`,
      duration: 3,
      animation: 'floating',
      easing: 'spring',
      camera: { ...DEFAULT_CAMERA },
      color: colors[scenes.length % colors.length],
      cameraSpeed: 1,
      scrollSpeed: 6,
      mode: 'animation',
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
    if (activeScene.mode === 'flow') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      const newHotspot = {
        id: `h${Date.now()}`,
        x, y,
        label: `Link`,
        targetSceneId: ''
      };
      updateScene(activeSceneId, { 
        hotspots: [...(activeScene.hotspots || []), newHotspot] 
      });
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
            onClick={() => addToast('Export requires Remotion integration', 'info')}
          >
            <Download size={11} />
            Export
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
          />
        </div>

        {/* Center Canvas */}
        <div className={s.canvasArea}>
          <div
            className={s.canvasViewport}
            style={background.style}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className={s.canvasGrid} />

            {/* Virtual Camera Stage & Overlays */}
            <CanvasArea
              activeScene={activeScene}
              isPlaying={isPlaying}
              currentTime={currentTime}
              device={device}
              frameColor={frameColor}
              deviceScale={deviceScale}
              background={background}
              layers={layers}
              camera={camera}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              handleDrop={handleDrop}
              handleDeviceScreenClick={handleDeviceScreenClick}
              handleSceneSeek={handleSceneSeek}
              handlePlayPause={handlePlayPause}
              addScene={addScene}
              getVariants={getVariants}
              animKey={animKey}
            />
          </div>

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
            onModeChange={m => updateScene(activeSceneId, { mode: m })}
            onAnimationChange={a => { updateScene(activeSceneId, { animation: a }); setAnimKey(k => k + 1); }}
            onEasingChange={e => updateScene(activeSceneId, { easing: e })}
            onDurationChange={d => updateScene(activeSceneId, { duration: d })}
            onCameraSpeedChange={sp => updateScene(activeSceneId, { cameraSpeed: sp })}
            onScrollSpeedChange={sp => updateScene(activeSceneId, { scrollSpeed: sp })}
            onHotspotUpdate={(id, targetId) => {
              const hs = activeScene.hotspots.map(h => h.id === id ? { ...h, targetSceneId: targetId } : h);
              updateScene(activeSceneId, { hotspots: hs });
            }}
            onHotspotDelete={id => {
              const hs = activeScene.hotspots.filter(h => h.id !== id);
              updateScene(activeSceneId, { hotspots: hs });
            }}
          />
        </div>
      </div>
    </div>
  );
}
