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
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import StudioTimeline from './StudioTimeline';
import s from './page.module.css';

/* ─── Animation variant builder ──────────────────────────────── */
function getVariants(animation: AnimationPreset, easing: EasingType) {
  const springConf: Transition = { type: 'spring', stiffness: 100, damping: 14 };
  // Map our EasingType strings to Framer Motion camelCase names
  const fmEase = easing === 'ease-out' ? 'easeOut'
    : easing === 'ease-in-out' ? 'easeInOut'
    : easing === 'anticipate' ? ([0.36, 0, 0.66, -0.56] as [number,number,number,number])
    : easing === 'bounce' ? 'backOut'
    : easing;
  const ease: Transition = easing === 'spring' ? springConf
    : { type: 'tween', ease: fmEase } as Transition;

  switch (animation) {
    case 'none':
      return {
        initial: { opacity: 1, x: 0, y: 0, scale: 1, rotateX: 0, rotateY: 0, rotateZ: 0 },
        animate: { opacity: 1, x: 0, y: 0, scale: 1, rotateX: 0, rotateY: 0, rotateZ: 0 },
        transition: { duration: 0.1 } as Transition,
      };
    case 'cinematic-reveal':
      return {
        initial: { opacity: 0, y: 120, scale: 0.82, rotateX: 40 },
        animate: { opacity: 1, y: 0, scale: 1, rotateX: 0 },
        transition: { ...ease, duration: 1.4 },
      };
    case 'floating':
      return {
        initial: { y: 0, rotateX: 6, rotateY: -8 },
        animate: { y: [-18, 18, -18], rotateX: [6, 10, 6], rotateY: [-8, -4, -8] },
        transition: { duration: 7, repeat: Infinity, ease: 'easeInOut' } as Transition,
      };
    case 'orbit':
      return {
        initial: { rotateY: -180, opacity: 0 },
        animate: { rotateY: 0, opacity: 1 },
        transition: { ...ease, duration: 2 },
      };
    case 'dolly-zoom':
      return {
        initial: { scale: 2.5, opacity: 0, filter: 'blur(8px)' },
        animate: { scale: 1, opacity: 1, filter: 'blur(0px)' },
        transition: { duration: 1.8, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } as Transition,
      };
    case 'camera-pan':
      return {
        initial: { x: -200, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        transition: { ...ease, duration: 1.6 },
      };
    case 'parallax':
      return {
        initial: { x: 60, y: 60, rotateZ: -4 },
        animate: { x: [-60, 60, -60], y: [-40, 40, -40], rotateZ: [4, -4, 4] },
        transition: { duration: 9, repeat: Infinity, ease: 'linear' } as Transition,
      };
    case 'perspective-reveal':
      return {
        initial: { rotateX: 60, scale: 0.7, opacity: 0, y: 80 },
        animate: { rotateX: 0, scale: 1, opacity: 1, y: 0 },
        transition: { ...ease, duration: 1.5 },
      };
    case 'startup-launch':
      return {
        initial: { y: 80, opacity: 0, scale: 0.85, filter: 'blur(12px)' },
        animate: { y: [-8, 8, -8], opacity: 1, scale: 1, filter: 'blur(0px)' },
        transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' } as Transition,
      };
    case 'focus-blur':
      return {
        initial: { filter: 'blur(24px)', opacity: 0, scale: 1.05 },
        animate: { filter: 'blur(0px)', opacity: 1, scale: 1 },
        transition: { duration: 1.8, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } as Transition,
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
  const [scenes, setScenes] = useState<SceneScene[]>(DEFAULT_SCENES);

  // Device
  const [device, setDevice] = useState<DeviceModel>('iphone-16-pro');
  const [frameColor, setFrameColor] = useState<FrameColor>('spaceBlack');
  const [background, setBackground] = useState<BackgroundOption>(BACKGROUNDS[0]);

  // Layers
  const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);
  const [activeLayer, setActiveLayer] = useState('device');

  // Image upload
  const [image, setImage] = useState<string | null>(null);
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
      setImage(ev.target?.result as string);
      addToast('Screenshot loaded ✓', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setImage(ev.target?.result as string);
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

  // Camera transform for virtual camera effect
  const glowLayer = layers.find(l => l.id === 'glow');
  const shadowLayer = layers.find(l => l.id === 'shadow');
  const deviceLayer = layers.find(l => l.id === 'device');

  const cameraTransform = `
    scale(${camera.zoom})
    translateX(${camera.panX}px)
    translateY(${camera.panY}px)
    rotateX(${camera.tiltX}deg)
    rotateY(${camera.tiltY}deg)
    rotateZ(${camera.rotation}deg)
  `;

  const animVariants = getVariants(activeScene.animation, activeScene.easing);
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

            {/* Virtual Camera Stage */}
            <div
              className={s.cameraStage}
              style={{
                transform: cameraTransform,
                filter: camera.blur > 0 ? `blur(${camera.blur}px)` : undefined,
                // cameraSpeed multiplies the base 0.6s transition
                transition: `transform ${(0.6 / (activeScene.cameraSpeed ?? 1)).toFixed(2)}s cubic-bezier(0.16,1,0.3,1), filter 0.6s ease`,
              }}
            >
              {/* Glow Layer */}
              {glowLayer?.visible && (
                <div style={{
                  position: 'absolute',
                  inset: -60,
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(168,85,247,0.18) 0%, transparent 70%)',
                  pointerEvents: 'none',
                  opacity: glowLayer.opacity / 100,
                  animation: activeScene.animation === 'startup-launch' || activeScene.animation === 'floating'
                    ? 'none' : undefined,
                }} />
              )}

              {/* Shadow Layer */}
              {shadowLayer?.visible && (
                <div style={{
                  position: 'absolute',
                  bottom: -40,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60%',
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)',
                  filter: 'blur(16px)',
                  opacity: shadowLayer.opacity / 100,
                  pointerEvents: 'none',
                }} />
              )}

              {/* Animated Device */}
              <div className={s.sceneCanvas}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${animKey}-${activeSceneId}`}
                    initial={animVariants.initial}
                    animate={animVariants.animate}
                    transition={animVariants.transition}
                    style={{
                      transformStyle: 'preserve-3d',
                      opacity: deviceLayer?.visible ? deviceLayer.opacity / 100 : 0,
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <div
                      onClick={handleDeviceScreenClick}
                      style={{ cursor: activeScene.mode === 'flow' ? 'crosshair' : 'pointer', position: 'relative', width: '100%', height: '100%' }}
                    >
                      <DeviceFrame model={device} color={frameColor} scale={deviceScale}>
                        {image ? (
                          activeScene.mode === 'scroll' ? (
                            <div 
                              className={`${s.scrollContainer} ${isPlaying ? s.scrollRunning : ''}`} 
                              style={{ 
                                '--scroll-duration': `${activeScene.scrollSpeed || 6}s`,
                                backgroundImage: `url(${image})`
                              } as React.CSSProperties}
                            />
                          ) : (
                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                              <img src={image} alt="Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                              {activeScene.mode === 'flow' && (activeScene.hotspots || []).map((h, i) => (
                                <div
                                  key={h.id}
                                  onClick={(e) => {
                                    if (isPlaying && h.targetSceneId) {
                                      e.stopPropagation();
                                      handleSceneSeek(h.targetSceneId);
                                    }
                                  }}
                                  style={{
                                    position: 'absolute',
                                    left: `${h.x}%`,
                                    top: `${h.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    width: 44,
                                    height: 44,
                                    borderRadius: '50%',
                                    background: isPlaying ? 'transparent' : 'rgba(168, 85, 247, 0.4)',
                                    border: isPlaying ? 'none' : '2px dashed #a855f7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '0.6rem',
                                    fontWeight: 'bold',
                                    cursor: isPlaying && h.targetSceneId ? 'pointer' : 'crosshair',
                                    zIndex: 10
                                  }}
                                >
                                  {!isPlaying && (i + 1)}
                                </div>
                              ))}
                            </div>
                          )
                        ) : (
                          <div className={s.uploadPlaceholder} style={{ pointerEvents: 'none' }}>
                            <div className={s.uploadIcon}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="3" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                              </svg>
                              <span className={s.uploadIconPlus}>+</span>
                            </div>
                            <span className={s.uploadLabel}>
                              {activeScene.mode === 'scroll'
                                ? 'Drop a long screenshot'
                                : 'Drop or click to upload'
                              }
                            </span>
                            <span className={s.uploadSub}>PNG, JPG, WebP</span>
                          </div>
                        )}

                        {/* Change Image Hover Overlay */}
                        {image && activeScene.mode !== 'flow' && !isPlaying && (
                          <div className={s.changeImageOverlay}>
                            <div className={s.uploadIcon} style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="3" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                              </svg>
                              <span className={s.uploadIconPlus}>+</span>
                            </div>
                            <span style={{ fontSize: '0.65rem', fontWeight: 600, marginTop: 8, color: 'white' }}>Change Image</span>
                          </div>
                        )}
                      </DeviceFrame>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Canvas Overlay */}
            <div className={s.canvasOverlay}>
              <button
                className={`${s.canvasChip} ${s.playChip}`}
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <><span>⏸</span> Pause</>
                ) : (
                  <><span>▶</span> Play All</>
                )}
              </button>
              <div className={s.canvasChip}>
                {activeScene.name} · {activeScene.animation.replace(/-/g, ' ')}
              </div>
            </div>

            <div className={s.canvasOverlayRight}>
              {isPlaying && (
                <div className={s.canvasChip}>
                  <div className={s.recordDot} />
                  {currentTime.toFixed(1)}s
                </div>
              )}
              <button
                className={s.canvasChip}
                onClick={addScene}
              >
                <Plus size={10} /> Scene
              </button>
            </div>
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
