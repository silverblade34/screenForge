import React, { useEffect, useRef, useState } from 'react';
import { Download, AlertCircle, X } from 'lucide-react';
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

  useEffect(() => {
    if (phase === 'rendering') {
      startRef.current = Date.now();
      setElapsed(0);
      setMsPerFrame(null);
    }
  }, [phase]);

  useEffect(() => {
    if (!phase) return;
    const id = setInterval(() => {
      const el = Date.now() - startRef.current;
      setElapsed(el);
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

  let eta: string | null = null;
  if (phase === 'rendering' && msPerFrame && totalFrames && currentFrame) {
    const remaining = (totalFrames - currentFrame) * msPerFrame;
    if (remaining > 0) eta = `~${(remaining / 1000).toFixed(0)}s remaining`;
  }

  if (errorMessage) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          style={{ 
            width: 440, 
            background: 'linear-gradient(145deg, rgba(24,24,27,0.95) 0%, rgba(12,12,15,0.98) 100%)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 20,
            padding: 32,
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(239,68,68,0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
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
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ 
          width: 480, 
          background: 'linear-gradient(145deg, rgba(24,24,27,0.95) 0%, rgba(12,12,15,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
          overflow: 'hidden'
        }}
      >
        {/* Header matching ExportDialog */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(99,102,241,0.2))',
              border: '1px solid rgba(168,85,247,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Download size={14} style={{ color: '#a855f7' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
                {phase === 'rendering' ? 'Generating Video...' : 'Finalizing Format...'}
              </h2>
              <p style={{ fontSize: '0.68rem', color: '#52525b', marginTop: 1 }}>
                {phase === 'rendering' ? 'Processing frames' : 'Encoding MP4'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
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
                  background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
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
        </div>

        {/* Global styles for animations */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}} />
      </motion.div>
    </div>
  );
}
