import React, { useRef } from 'react';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { Plus } from 'lucide-react';
import { DeviceFrame } from '@/components/mockup/DeviceFrame';
import { SceneScene, DeviceModel, FrameColor, BackgroundOption, AnimationPreset, EasingType, Layer, CameraState, TextLayer } from './types';
import s from './page.module.css';

interface CanvasAreaProps {
  activeScene: SceneScene;
  scenes: SceneScene[];
  isPlaying: boolean;
  currentTime: number;
  device: DeviceModel;
  frameColor: FrameColor;
  deviceScale: number;
  background: BackgroundOption;
  layers: Layer[];
  camera: CameraState;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDeviceScreenClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleSceneSeek: (id: string) => void;
  handlePlayPause: () => void;
  addScene: () => void;
  getVariants: (animation: AnimationPreset, easing: EasingType) => any;
  animKey: number;

  // Text Layers props
  textLayers?: TextLayer[];
  activeTextLayerId?: string | null;
  editingTextLayerId?: string | null;
  setActiveTextLayerId?: (id: string | null) => void;
  setEditingTextLayerId?: (id: string | null) => void;
  updateTextLayer?: (id: string, updates: Partial<TextLayer>) => void;
  draggingLayerRef?: React.MutableRefObject<string | null>;
  dragStartRef?: React.MutableRefObject<{ mx: number; my: number; sx: number; sy: number } | null>;
  resizeLayerRef?: React.MutableRefObject<string | null>;
  resizeStartRef?: React.MutableRefObject<{ mx: number; w: number } | null>;
  isExporting?: boolean;
  handleTextLayerPointerDown?: (e: React.PointerEvent, id: string) => void;
  handleTextLayerPointerMove?: (e: React.PointerEvent) => void;
  handleTextLayerPointerUp?: (e: React.PointerEvent) => void;
}

export default function CanvasArea({
  activeScene,
  scenes,
  isPlaying,
  currentTime,
  device,
  frameColor,
  deviceScale,
  background,
  layers,
  camera,
  fileInputRef,
  handleFileChange,
  handleDrop,
  handleDeviceScreenClick,
  handleSceneSeek,
  handlePlayPause,
  addScene,
  getVariants,
  animKey,
  textLayers = [],
  activeTextLayerId,
  editingTextLayerId,
  setActiveTextLayerId,
  setEditingTextLayerId,
  updateTextLayer,
  draggingLayerRef,
  dragStartRef,
  resizeLayerRef,
  resizeStartRef,
  isExporting,
  handleTextLayerPointerDown,
  handleTextLayerPointerMove,
  handleTextLayerPointerUp,
}: CanvasAreaProps) {
  // Compute layers
  const glowLayer = layers.find(l => l.id === 'glow');
  const shadowLayer = layers.find(l => l.id === 'shadow');
  const deviceLayer = layers.find(l => l.id === 'device');

  // 1. Find local time and index
  let currentSceneIndex = 0;
  let localTime = 0;
  let acc = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (currentTime >= acc && currentTime < acc + scenes[i].duration) {
      currentSceneIndex = i;
      localTime = currentTime - acc;
      break;
    }
    acc += scenes[i].duration;
    if (i === scenes.length - 1 && currentTime >= acc) {
      currentSceneIndex = i;
      localTime = scenes[i].duration;
    }
  }

  // 2. Compute effective camera
  let effectiveCamera = { ...camera };
  const transitionDuration = 0.6 / (scenes[currentSceneIndex].cameraSpeed || 1);
  if (currentSceneIndex > 0 && localTime < transitionDuration) {
    const prevCamera = scenes[currentSceneIndex - 1].camera;
    const nextCamera = scenes[currentSceneIndex].camera;
    let t = localTime / transitionDuration;
    // Apply easeOutExpo equivalent for smoothness
    t = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    effectiveCamera = {
      zoom: prevCamera.zoom + (nextCamera.zoom - prevCamera.zoom) * t,
      panX: prevCamera.panX + (nextCamera.panX - prevCamera.panX) * t,
      panY: prevCamera.panY + (nextCamera.panY - prevCamera.panY) * t,
      tiltX: prevCamera.tiltX + (nextCamera.tiltX - prevCamera.tiltX) * t,
      tiltY: prevCamera.tiltY + (nextCamera.tiltY - prevCamera.tiltY) * t,
      rotation: prevCamera.rotation + (nextCamera.rotation - prevCamera.rotation) * t,
      blur: prevCamera.blur + (nextCamera.blur - prevCamera.blur) * t,
    };
  }

  // Compute camera transform
  const cameraTransform = `
    scale(${effectiveCamera.zoom})
    translateX(${effectiveCamera.panX}px)
    translateY(${effectiveCamera.panY}px)
    rotateX(${effectiveCamera.tiltX}deg)
    rotateY(${effectiveCamera.tiltY}deg)
    rotateZ(${effectiveCamera.rotation}deg)
  `;

  // Compute scroll bg pos
  let scrollBgPos = 'top center';
  if (activeScene.mode === 'scroll' && activeScene.image) {
    const scrollDur = activeScene.scrollSpeed || 6;
    const progress = Math.min(1, localTime / scrollDur);
    scrollBgPos = `50% ${progress * 100}%`;
  }

  const animVariants = getVariants(activeScene.animation, activeScene.easing);

  return (
    <div className={s.canvasViewport} style={background.style} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
      <div className={s.canvasGrid} data-export-hide="true" />

      {/* Virtual Camera Stage */}
      <div
        className={s.cameraStage}
        style={{
          transform: cameraTransform,
          filter: effectiveCamera.blur > 0 ? `blur(${effectiveCamera.blur}px)` : undefined,
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
            animation: activeScene.animation === 'hero-reveal' || activeScene.animation === 'floating-drift'
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

        {/* 3D Scene container */}
        <div className={s.sceneCanvas}>
          <AnimatePresence mode={isExporting ? 'sync' : 'wait'}>
            <motion.div
              key={isExporting ? activeScene.id : `${activeScene.id}-${animKey}`}
              variants={animVariants}
              initial={isExporting ? false : 'initial'}
              animate="animate"
              transition={isExporting ? { duration: 0 } : animVariants.transition}
              style={{
                perspective: 1200,
                transformStyle: 'preserve-3d',
                opacity: deviceLayer?.visible ? deviceLayer.opacity / 100 : 0
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
                  {activeScene.image ? (
                    activeScene.mode === 'scroll' ? (
                      <div
                        className={s.scrollContainer}
                        style={{
                          backgroundImage: `url(${activeScene.image})`,
                          backgroundPosition: scrollBgPos,
                        }}
                      />
                    ) : (
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <img src={activeScene.image} alt="Mockup" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        {activeScene.hotspots?.map((h, i) => {
                          // Determine shape class
                          let shapeClass = s.hotspotShapeCircle;
                          if (h.shape === 'pill') shapeClass = s.hotspotShapePill;
                          else if (h.shape === 'invisible') shapeClass = s.hotspotShapeInvisible;

                          // Determine animation class
                          let animClass = '';
                          if (isPlaying && h.animationPreset) {
                            if (h.animationPreset === 'pulse') animClass = s.hotspotPulse;
                            else if (h.animationPreset === 'glow') animClass = s.hotspotGlow;
                            else if (h.animationPreset === 'float') animClass = s.hotspotFloat;
                            else if (h.animationPreset === 'fade') animClass = s.hotspotFade;
                            else if (h.animationPreset === 'ripple') animClass = s.hotspotRipple;
                          }

                          return (
                            <div
                              key={h.id}
                              className={`${s.hotspot} ${shapeClass} ${animClass} ${!isPlaying ? s.hotspotEditMode : ''}`}
                              onClick={(e) => {
                                if (isPlaying && h.targetSceneId) {
                                  e.stopPropagation();
                                  handleSceneSeek(h.targetSceneId);
                                }
                              }}
                              style={{
                                left: `${h.x}%`,
                                top: `${h.y}%`,
                                width: h.shape === 'pill' ? 'auto' : `${h.width}%`,
                                height: `${h.height}%`,
                                minHeight: '44px',
                                opacity: h.opacity !== undefined ? h.opacity / 100 : 1,
                                cursor: isPlaying && h.targetSceneId ? 'pointer' : 'crosshair',
                              }}
                            >
                              {!isPlaying && !h.label && (i + 1)}
                              {h.label && <span className={s.hotspotLabel}>{h.label}</span>}
                            </div>
                          );
                        })}
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
                  {activeScene.image && activeScene.mode !== 'flow' && !isPlaying && (
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

      {/* Text Layers */}
      {textLayers?.map(layer => {
        if (layer.hidden) return null;

        const startTime = layer.startTime ?? 0;
        const duration = layer.duration ?? 3;
        const localTime = currentTime - startTime;

        // Hide if outside timeline bounds
        const isVisible = localTime >= 0 && localTime <= duration;
        if (!isVisible) return null;

        let animOpacity = 1;
        let animY = 0;
        let animScale = 1;
        let displayText = layer.text;

        if (isVisible) {
          const animInDuration = 0.5; // 500ms entrance
          const inProgress = Math.min(1, Math.max(0, localTime / animInDuration));

          if (layer.animationIn === 'fade') {
            animOpacity = inProgress;
          } else if (layer.animationIn === 'slide-up') {
            animOpacity = inProgress;
            animY = (1 - inProgress) * 30; // comes from 30px below
          } else if (layer.animationIn === 'bounce') {
            if (localTime < animInDuration) {
              animOpacity = inProgress;
              const t = inProgress;
              // Simple elastic bounce
              animScale = 1 + Math.sin(t * Math.PI * 3) * Math.pow(1 - t, 2) * 0.5;
            }
          } else if (layer.animationIn === 'typewriter') {
            const charsPerSecond = 20;
            const charsToShow = Math.floor(localTime * charsPerSecond);
            if (charsToShow < layer.text.length) {
              displayText = layer.text.substring(0, charsToShow);
            }
          }
        }

        const isGradient = layer.gradient;
        const gradFrom = layer.gradientFrom ?? '#a855f7';
        const gradTo = layer.gradientTo ?? '#6366f1';

        return (
          <div
            key={layer.id}
            className={`${s.canvasTextLayer} ${activeTextLayerId === layer.id && !isExporting ? s.canvasTextLayerActive : ''}`}
            onDoubleClick={() => setEditingTextLayerId && setEditingTextLayerId(layer.id)}
            onPointerDown={e => handleTextLayerPointerDown && handleTextLayerPointerDown(e, layer.id)}
            onPointerMove={handleTextLayerPointerMove}
            onPointerUp={handleTextLayerPointerUp}
            onPointerCancel={handleTextLayerPointerUp}
            style={{
              position: 'absolute',
              left: `${layer.x}%`,
              top: `calc(${layer.y}% + ${animY}px)`,
              transform: `translate(-50%, -50%) rotate(${layer.rotation ?? 0}deg) scale(${animScale})`,
              maxWidth: layer.width ?? 700,
              width: layer.width ?? 700,
              textAlign: layer.align,
              fontFamily: layer.fontFamily,
              fontSize: layer.fontSize,
              fontWeight: layer.fontWeight,
              opacity: (layer.opacity ?? 1) * animOpacity,
              letterSpacing: layer.letterSpacing,
              lineHeight: layer.lineHeight,
              color: isGradient ? 'transparent' : layer.color,
              backgroundImage: isGradient ? `linear-gradient(135deg, ${gradFrom}, ${gradTo})` : 'none',
              WebkitBackgroundClip: isGradient ? 'text' : 'border-box',
              WebkitTextFillColor: isGradient ? 'transparent' : 'inherit',
              backgroundClip: isGradient ? 'text' : 'border-box',
              textShadow: [
                layer.glow > 0 ? `0 0 ${layer.glow}px ${layer.color}` : '',
                layer.shadow ? '0 4px 24px rgba(0,0,0,0.5)' : '',
              ].filter(Boolean).join(', ') || 'none',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              pointerEvents: isExporting ? 'none' : 'auto',
              display: isExporting && layer.hidden ? 'none' : 'block',
              zIndex: layer.zIndex,
            }}
          >
            <div
              key={editingTextLayerId === layer.id ? 'edit' : 'view'}
              contentEditable={editingTextLayerId === layer.id && !isExporting}
              suppressContentEditableWarning={true}
              onInput={e => updateTextLayer && updateTextLayer(layer.id, { text: (e.target as HTMLElement).innerText })}
              onBlur={() => setEditingTextLayerId && setEditingTextLayerId(null)}
              style={{ outline: 'none', width: '100%', height: '100%', whiteSpace: 'pre-wrap' }}
            >
              {editingTextLayerId === layer.id && !isExporting ? layer.text : displayText}
            </div>
            {activeTextLayerId === layer.id && !isExporting && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    top: -6,
                    left: -6,
                    width: 12,
                    height: 12,
                    background: '#a855f7',
                    cursor: 'nwse-resize',
                  }}
                  onPointerDown={e => {
                    e.stopPropagation();
                    if (resizeLayerRef) resizeLayerRef.current = layer.id;
                    if (resizeStartRef) resizeStartRef.current = { mx: e.clientX, w: layer.width ?? 700 };
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={e => {
                    if (resizeLayerRef?.current !== layer.id || !resizeStartRef?.current) return;
                    const dx = e.clientX - resizeStartRef.current.mx;
                    const newW = Math.max(100, resizeStartRef.current.w + dx);
                    if (updateTextLayer) updateTextLayer(layer.id, { width: newW });
                  }}
                  onPointerUp={e => {
                    if (resizeLayerRef?.current === layer.id) {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                      if (resizeLayerRef) resizeLayerRef.current = null;
                      if (resizeStartRef) resizeStartRef.current = null;
                    }
                  }}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
