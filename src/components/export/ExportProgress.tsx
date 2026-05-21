import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Zap, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    if (remaining > 0) eta = `~${(remaining / 1000).toFixed(0)}s remaining`;
  }

  // Error state
  if (errorMessage) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)'
      }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          style={{ 
            width: 440, 
            background: 'rgba(24, 24, 27, 0.8)', 
            padding: 32, 
            borderRadius: 24, 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 40px rgba(239, 68, 68, 0.1)'
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <AlertCircle size={24} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: 12, letterSpacing: '-0.02em' }}>
            Export Failed
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem', marginBottom: 24, lineHeight: 1.6 }}>
            {errorMessage}
          </p>
          <button
            onClick={onDismissError}
            style={{ 
              width: '100%', padding: '12px 20px', borderRadius: 12, border: 'none', 
              background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 500,
              fontSize: '0.9rem', transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#dc2626'}
            onMouseOut={e => e.currentTarget.style.background = '#ef4444'}
          >
            Close & Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: 'white', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)'
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ 
          width: 420, 
          background: 'rgba(20, 20, 22, 0.75)', 
          padding: 36, 
          borderRadius: 28, 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Ambient Top Glow */}
        <div style={{
          position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)',
          width: 200, height: 100, background: 'rgba(168, 85, 247, 0.3)',
          filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ 
              width: 44, height: 44, borderRadius: 14, 
              background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(99,102,241,0.2))',
              border: '1px solid rgba(168,85,247,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(168,85,247,0.2)'
            }}>
              {phase === 'rendering' 
                ? <Loader2 size={22} color="#c084fc" className="animate-spin" />
                : <Zap size={22} color="#c084fc" />
              }
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'white', letterSpacing: '-0.01em', margin: 0 }}>
                {phase === 'rendering' ? 'Generating Video' : 'Finalizing Format'}
              </h2>
              <p style={{ color: '#a1a1aa', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
                {phase === 'rendering' ? 'Processing high-quality frames...' : 'Encoding cinematic sequence...'}
              </p>
            </div>
          </div>

          {/* Progress Section */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {pct}<span style={{ fontSize: '1.25rem', color: '#a1a1aa', fontWeight: 500, marginLeft: 2 }}>%</span>
              </span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {eta ? eta : 'Calculating...'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#52525b' }}>
                  {elapsedSec}s elapsed
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #8b5cf6, #c084fc)',
                  borderRadius: 99,
                  position: 'relative'
                }}
              >
                {/* Shine effect */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  animation: 'shimmer 1.5s infinite',
                }} />
              </motion.div>
            </div>
          </div>

          {/* Phase indicators */}
          <div style={{ display: 'flex', gap: 8 }}>
            {(['rendering', 'encoding'] as const).map(p => {
              const isActive = phase === p;
              const isPast = p === 'rendering' && phase === 'encoding';
              return (
                <div key={p} style={{
                  flex: 1, padding: '10px 12px', borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.3s ease',
                  background: isActive ? 'rgba(168,85,247,0.1)' : (isPast ? 'rgba(255,255,255,0.02)' : 'transparent'),
                  border: `1px solid ${isActive ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  color: isActive ? '#e879f9' : (isPast ? '#a1a1aa' : '#52525b'),
                }}>
                  <div style={{ 
                    width: 16, height: 16, borderRadius: '50%', 
                    border: `2px solid ${isActive ? '#c084fc' : (isPast ? '#71717a' : '#3f3f46')}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? '#c084fc' : 'transparent'
                  }}>
                    {isPast && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#18181b' }} />}
                  </div>
                  {p === 'rendering' ? 'Rendering' : 'Encoding'}
                </div>
              );
            })}
          </div>

          {/* Global styles for animations */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
          `}} />
        </div>
      </motion.div>
    </div>
  );
}
