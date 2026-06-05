import { useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';
import { AnimationPreset } from '@/pages/device-animation/types';

// ── Easing helpers (match the CSS curves used in CanvasArea.tsx) ──────────────

/** easeInOut quadratic — matches the CSS computeExportAnimStyle helper */
function easeInOut(p: number): number {
  return p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
}

/** easeOutExpo — used for hero-reveal / cinematic feel */
function easeOutExpo(p: number): number {
  return p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
}

interface AnimationState {
  opacity: number;
  scaleX: number;
  scaleY: number;
  x: number;  // offset from group's base x
  y: number;  // offset from group's base y
  skewX: number;
  skewY: number;
}

const IDENTITY: AnimationState = {
  opacity: 1, scaleX: 1, scaleY: 1, x: 0, y: 0, skewX: 0, skewY: 0,
};

/**
 * Compute the animation state for a given preset at a given local time (seconds).
 * This mirrors the logic in CanvasArea.tsx > computeExportAnimStyle() and
 * translates it into Konva Group properties.
 */
function computeState(preset: AnimationPreset, localTime: number): AnimationState {
  const t = localTime;

  switch (preset) {
    /* ── Continuous loops ── */
    case 'floating-drift': {
      const period = 8;
      const s = Math.sin((t / period) * Math.PI * 2);
      return { opacity: 1, scaleX: 1 + s * 0.006, scaleY: 1 + s * 0.006, x: 0, y: s * 10, skewX: s * 0.01, skewY: 0 };
    }
    case 'ambient-motion': {
      const period = 12;
      const s = Math.sin((t / period) * Math.PI * 2);
      return { opacity: 1, scaleX: 1 + s * 0.004, scaleY: 1 + s * 0.004, x: s * 6, y: s * 6 - 2, skewX: s * 0.008, skewY: 0 };
    }
    case 'depth-parallax': {
      const period = 10;
      const s = Math.sin((t / period) * Math.PI * 2);
      return { opacity: 1, scaleX: 1 + s * 0.009, scaleY: 1 + s * 0.009, x: 0, y: s * 14, skewX: 0, skewY: 0 };
    }

    /* ── One-shot entrances ── */
    case 'cinematic-push': {
      const p = easeInOut(Math.min(t / 1.6, 1));
      const scale = 0.94 + p * 0.06;
      return { opacity: p, scaleX: scale, scaleY: scale, x: 0, y: 14 - p * 14, skewX: 0, skewY: 0 };
    }
    case 'hero-reveal': {
      const p = easeOutExpo(Math.min(t / 1.2, 1));
      const scale = 0.96 + p * 0.04;
      return { opacity: p, scaleX: scale, scaleY: scale, x: 0, y: 32 - p * 32, skewX: 0, skewY: 0 };
    }
    case 'precision-zoom': {
      const p = easeInOut(Math.min(t / 1.4, 1));
      const scale = 0.88 + p * 0.12;
      return { opacity: p, scaleX: scale, scaleY: scale, x: 0, y: 0, skewX: 0, skewY: 0 };
    }
    case 'focus-pull': {
      const p = easeInOut(Math.min(t / 1.4, 1));
      const scale = 1.03 - p * 0.03;
      return { opacity: p, scaleX: scale, scaleY: scale, x: 0, y: 0, skewX: 0, skewY: 0 };
    }
    case 'camera-slide': {
      const p = easeInOut(Math.min(t / 1.4, 1));
      const scale = 0.97 + p * 0.03;
      return { opacity: p, scaleX: scale, scaleY: scale, x: -80 + p * 80, y: 0, skewX: 0, skewY: 0 };
    }

    case 'none':
    default:
      return IDENTITY;
  }
}

interface UseKonvaAnimationOptions {
  groupRef: React.RefObject<Konva.Group | null>;
  preset: AnimationPreset;
  localTime: number;  // seconds into the current scene
  /** When true the animation runs via rAF (live preview).
   *  When false it's driven by localTime (export scrubbing). */
  isLive: boolean;
  baseX: number;
  baseY: number;
}

/**
 * Drives animation for a Konva.Group.
 *
 * Live mode: uses Konva.Animation (requestAnimationFrame) to update
 * the group each frame based on elapsed wall-clock time.
 *
 * Scrub mode: directly applies the state for the given localTime (used
 * during export where each frame is rendered at a specific time).
 */
export function useKonvaAnimation({
  groupRef,
  preset,
  localTime,
  isLive,
  baseX,
  baseY,
}: UseKonvaAnimationOptions) {
  const animRef = useRef<Konva.Animation | null>(null);
  const startTimeRef = useRef<number>(0);

  const applyState = useCallback((state: AnimationState, group: Konva.Group) => {
    group.opacity(state.opacity);
    group.scaleX(state.scaleX);
    group.scaleY(state.scaleY);
    group.x(baseX + state.x);
    group.y(baseY + state.y);
    group.skewX(state.skewX);
    group.skewY(state.skewY);
    group.getLayer()?.batchDraw();
  }, [baseX, baseY]);

  // Live mode: Konva.Animation loop
  useEffect(() => {
    if (!isLive) return;
    const group = groupRef.current;
    if (!group) return;

    startTimeRef.current = performance.now();

    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const elapsed = frame.time / 1000; // seconds
      const state = computeState(preset, elapsed);
      applyState(state, group);
    }, group.getLayer() ?? undefined);

    anim.start();
    animRef.current = anim;

    return () => {
      anim.stop();
      animRef.current = null;
    };
  }, [isLive, preset, groupRef, applyState]);

  // Scrub mode: apply state for exact localTime
  useEffect(() => {
    if (isLive) return;
    const group = groupRef.current;
    if (!group) return;
    const state = computeState(preset, localTime);
    applyState(state, group);
  }, [isLive, preset, localTime, groupRef, applyState]);
}
