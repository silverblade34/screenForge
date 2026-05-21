import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Film, Zap } from 'lucide-react';

interface Props {
  phase: 'rendering' | 'encoding' | null;
  progress: number;
  currentFrame?: number;
  totalFrames?: number;
  errorMessage?: string | null;
  onDismissError?: () => void;
}

export function ExportProgress({ phase, progress, currentFrame, totalFrames, errorMessage, onDismissError }: Props) {
  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [msPerFrame, setMsPerFrame] = useState<number | null>(null);

  // Reset timer when export phase starts
  useEffect(() => {
    if (phase === 'rendering') {
      startRef.current = Date.now();
      setElapsed(0);
      setMsPerFrame(null);
    }
  }, [phase]);

  // Tick elapsed timer every second
  useEffect(() => {
    if (!phase) return;
    const id = setInterval(() => {
      const el = Date.now() - startRef.current;
      setElapsed(el);
      // Estimate ms/frame from elapsed and frames done
      if (phase === 'rendering' && currentFrame && currentFrame > 0) {
        setMsPerFrame(el / currentFrame);
      }
    }, 500);
    return () => clearInterval(id);
  }, [phase, currentFrame]);

  if (!phase && !errorMessage) return null;

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const pct = Math.round(clampedProgress * 100);
  const elapsedSec = (elapsed / 1000).toFixed(0);

  // ETA estimate
  let eta: string | null = null;
  if (phase === 'rendering' && msPerFrame && totalFrames && currentFrame) {
    const remaining = (totalFrames - currentFrame) * msPerFrame;
    if (remaining > 0) eta = `~${(remaining / 1000).toFixed(0)}s left`;
  }

  // Error state
  if (errorMessage) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{ width: 420, background: '#18181b', padding: 32, borderRadius: 16, border: '1px solid #ef4444' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fca5a5', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ Export Failed
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem', marginBottom: 20, fontFamily: 'monospace', background: '#0c0c0c', padding: 12, borderRadius: 8, wordBreak: 'break-word' }}>
            {errorMessage}
          </p>
          <p style={{ color: '#52525b', fontSize: '0.75rem', marginBottom: 20 }}>
            Check the browser DevTools console for full details.
          </p>
          <button
            onClick={onDismissError}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#27272a', color: 'white', cursor: 'pointer', fontWeight: 500 }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: 'white', backdropFilter: 'blur(8px)'
    }}>
      <div style={{ width: 420, background: '#18181b', padding: 32, borderRadius: 16, border: '1px solid #3f3f46' }}>

        {/* Header */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          {phase === 'rendering'
            ? <><Loader2 size={20} className="animate-spin" /> Rendering Frames</>
            : <><Zap size={20} style={{ color: '#a855f7' }} /> Encoding Video</>
          }
        </h2>

        {/* Status text */}
        <p style={{ color: '#71717a', fontSize: '0.8rem', marginBottom: 20 }}>
          {phase === 'rendering' && totalFrames
            ? <>Frame <strong style={{ color: '#d4d4d8' }}>{currentFrame ?? 0}</strong> of <strong style={{ color: '#d4d4d8' }}>{totalFrames}</strong>
              {msPerFrame ? <span style={{ marginLeft: 8 }}>· {msPerFrame.toFixed(0)}ms/frame</span> : null}
              {eta ? <span style={{ marginLeft: 8, color: '#a855f7' }}>· {eta}</span> : null}
            </>
            : 'Compressing frames into MP4 via FFmpeg.wasm...'
          }
        </p>

        {/* Progress bar */}
        <div style={{ width: '100%', height: 6, background: '#27272a', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
              borderRadius: 99,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Pct + elapsed */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#52525b' }}>
          <span style={{ color: pct > 0 ? '#a855f7' : '#52525b', fontWeight: 600 }}>{pct}%</span>
          <span>Elapsed: {elapsedSec}s</span>
        </div>

        {/* Phase indicators */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          {(['rendering', 'encoding'] as const).map(p => (
            <div key={p} style={{
              flex: 1, padding: '6px 8px', borderRadius: 6, textAlign: 'center',
              fontSize: '0.7rem', fontWeight: 500,
              background: phase === p ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${phase === p ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.06)'}`,
              color: phase === p ? '#c084fc' : '#3f3f46',
            }}>
              {p === 'rendering' ? '① Render' : '② Encode'}
            </div>
          ))}
        </div>

        <p style={{ color: '#27272a', fontSize: '0.65rem', marginTop: 16, textAlign: 'center' }}>
          Check the browser console (F12) for detailed logs
        </p>
      </div>
    </div>
  );
}
