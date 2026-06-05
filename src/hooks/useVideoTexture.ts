import { useEffect, useRef, useState } from 'react';

interface VideoTextureOptions {
  src: string | null;
  isPlaying: boolean;
  loop?: boolean;
  muted?: boolean;
  playbackRate?: number;
  trimStart?: number;
  trimEnd?: number;
  seekTime?: number;
}

/**
 * Creates and manages an HTMLVideoElement that can be passed directly to
 * react-konva's <Image image={videoElement} />.
 *
 * Konva calls ctx.drawImage(videoElement) each animation tick, so the
 * current video frame is automatically rendered without any manual canvas
 * manipulation.
 *
 * CORS: Videos loaded as base64 dataURLs (which is what ScreenForge does)
 * never trigger SecurityError on stage.toBlob(). External URL videos would
 * need crossOrigin="anonymous" and a CORS-enabled server.
 */
export function useVideoTexture({
  src,
  isPlaying,
  loop = true,
  muted = true,
  playbackRate = 1,
  trimStart = 0,
  trimEnd,
  seekTime,
}: VideoTextureOptions): HTMLVideoElement | null {
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const trimEndRef = useRef(trimEnd);
  const trimStartRef = useRef(trimStart);

  // Keep refs current for the timeupdate handler
  trimEndRef.current = trimEnd;
  trimStartRef.current = trimStart;

  // Create / destroy video element when src changes
  useEffect(() => {
    if (!src) {
      setVideoEl(null);
      return;
    }

    const vid = document.createElement('video');
    vid.src = src;
    vid.loop = false; // We manage loop manually via timeupdate
    vid.muted = muted;
    vid.playsInline = true;
    vid.preload = 'auto';
    // crossOrigin only needed for external URLs — dataURLs are same-origin
    if (!src.startsWith('data:')) {
      vid.crossOrigin = 'anonymous';
    }

    setVideoEl(vid);

    return () => {
      vid.pause();
      vid.src = '';
      setVideoEl(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Sync muted
  useEffect(() => {
    if (!videoEl) return;
    videoEl.muted = muted;
  }, [videoEl, muted]);

  // Sync playback rate
  useEffect(() => {
    if (!videoEl) return;
    videoEl.playbackRate = playbackRate;
  }, [videoEl, playbackRate]);

  // Sync play/pause
  useEffect(() => {
    if (!videoEl) return;
    if (isPlaying) {
      const ts = trimStartRef.current ?? 0;
      const te = trimEndRef.current;
      if (videoEl.currentTime < ts || (te !== undefined && videoEl.currentTime >= te)) {
        videoEl.currentTime = ts;
      }
      videoEl.play().catch(() => {});
    } else {
      videoEl.pause();
    }
  }, [videoEl, isPlaying]);

  // Sync seekTime (during export or scrubbing when paused)
  useEffect(() => {
    if (!videoEl || isPlaying || seekTime === undefined) return;
    const ts = trimStartRef.current ?? 0;
    const targetTime = ts + seekTime;
    
    // Check if we need to loop/trim
    const te = trimEndRef.current;
    if (te !== undefined && targetTime >= te) {
      if (!loop) {
        videoEl.currentTime = ts;
        return;
      }
      // If loop, wrap the time around
      const duration = te - ts;
      videoEl.currentTime = ts + (seekTime % duration);
    } else {
      videoEl.currentTime = targetTime;
    }
  }, [videoEl, isPlaying, seekTime, loop]);

  // Handle trim-out loop
  useEffect(() => {
    if (!videoEl) return;

    const handleTimeUpdate = () => {
      const te = trimEndRef.current;
      const ts = trimStartRef.current ?? 0;
      if (te !== undefined && videoEl.currentTime >= te) {
        if (loop) {
          videoEl.currentTime = ts;
          if (isPlaying) videoEl.play().catch(() => {});
        } else {
          videoEl.pause();
          videoEl.currentTime = ts;
        }
      }
    };

    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    return () => videoEl.removeEventListener('timeupdate', handleTimeUpdate);
  }, [videoEl, loop, isPlaying]);

  return videoEl;
}
