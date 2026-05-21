import React, { useState } from 'react';
import { Download, X, Film, Zap, Clock, ChevronRight } from 'lucide-react';
import { ExportSettings } from '@/lib/export/videoExporter';

interface Props {
  onClose: () => void;
  onExport: (settings: Omit<ExportSettings, 'canvasElement' | 'onSeekFrame' | 'onProgress'>) => void;
  duration: number;
}

type Resolution = '720p' | '1080p' | '1440p' | '4K';
type FPS = 24 | 30 | 60;
type Quality = 'Standard' | 'High' | 'Ultra';

const RESOLUTIONS: { label: Resolution; w: number; h: number; badge?: string }[] = [
  { label: '720p',  w: 1280,  h: 720  },
  { label: '1080p', w: 1920,  h: 1080, badge: 'HD' },
  { label: '1440p', w: 2560,  h: 1440, badge: '2K' },
  { label: '4K',    w: 3840,  h: 2160, badge: '4K' },
];

const FPS_OPTIONS: { val: FPS; label: string; desc: string }[] = [
  { val: 24, label: '24', desc: 'Cinematic' },
  { val: 30, label: '30', desc: 'Standard'  },
  { val: 60, label: '60', desc: 'Smooth'    },
];

const QUALITY_OPTIONS: { val: Quality; label: string; desc: string; crf: string }[] = [
  { val: 'Standard', label: 'Standard', desc: 'Faster export',  crf: 'CRF 23' },
  { val: 'High',     label: 'High',     desc: 'Balanced',       crf: 'CRF 18' },
  { val: 'Ultra',    label: 'Ultra',    desc: 'Best quality',   crf: 'CRF 14' },
];

/* Estimate export time in seconds (rough heuristic) */
function estimateTime(fps: FPS, duration: number, res: Resolution): string {
  const frames = Math.ceil(duration * fps);
  // html2canvas ~200-500ms per frame, faster at lower res
  const msPerFrame = res === '720p' ? 180 : res === '1080p' ? 280 : res === '1440p' ? 450 : 700;
  const secs = Math.ceil((frames * msPerFrame) / 1000);
  if (secs < 60) return `~${secs}s`;
  return `~${Math.ceil(secs / 60)}m`;
}

export function ExportDialog({ onClose, onExport, duration }: Props) {
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [fps, setFps] = useState<FPS>(30);
  const [quality, setQuality] = useState<Quality>('Ultra');

  const res = RESOLUTIONS.find(r => r.label === resolution)!;
  const totalFrames = Math.ceil(duration * fps);
  const est = estimateTime(fps, duration, resolution);

  const handleExport = () => {
    onExport({ width: res.w, height: res.h, fps, quality, duration, scenes: [], textLayers: [] });
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 480,
        background: 'linear-gradient(145deg, rgba(24,24,27,0.95) 0%, rgba(12,12,15,0.98) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>

        {/* Header */}
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
              <Film size={14} style={{ color: '#a855f7' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
                Export Video
              </h2>
              <p style={{ fontSize: '0.68rem', color: '#52525b', marginTop: 1 }}>
                {duration.toFixed(1)}s · {totalFrames} frames
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#52525b', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLButtonElement).style.color = '#52525b'; }}
          >
            <X size={12} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Resolution */}
          <Section label="Resolution">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
              {RESOLUTIONS.map(r => (
                <OptionBtn
                  key={r.label}
                  active={resolution === r.label}
                  onClick={() => setResolution(r.label)}
                  label={r.label}
                  sub={`${r.w}×${r.h}`}
                />
              ))}
            </div>
          </Section>

          {/* FPS */}
          <Section label="Framerate">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {FPS_OPTIONS.map(f => (
                <OptionBtn
                  key={f.val}
                  active={fps === f.val}
                  onClick={() => setFps(f.val)}
                  label={`${f.label} fps`}
                  sub={f.desc}
                />
              ))}
            </div>
          </Section>

          {/* Quality */}
          <Section label="Encode Quality">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {QUALITY_OPTIONS.map(q => (
                <OptionBtn
                  key={q.val}
                  active={quality === q.val}
                  onClick={() => setQuality(q.val)}
                  label={q.label}
                  sub={q.crf}
                />
              ))}
            </div>
          </Section>

          {/* Summary pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            background: 'rgba(168,85,247,0.06)',
            border: '1px solid rgba(168,85,247,0.14)',
            borderRadius: 10,
          }}>
            <Clock size={13} style={{ color: '#a855f7', flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: '#a1a1aa', flex: 1 }}>
              <strong style={{ color: 'white' }}>{totalFrames} frames</strong> at{' '}
              <strong style={{ color: 'white' }}>{res.w}×{res.h}</strong>
            </span>
            <span style={{
              fontSize: '0.68rem', fontWeight: 600, color: '#a855f7',
              background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)',
              padding: '2px 8px', borderRadius: 20,
            }}>
              {est}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px', borderRadius: 9,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              color: '#71717a', fontSize: '0.8rem', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLButtonElement).style.color = '#71717a'; }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: '9px 20px', borderRadius: 9,
              border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              color: 'white', fontSize: '0.8rem', fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
              boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'linear-gradient(135deg, #8b5cf6, #818cf8)'; b.style.boxShadow = '0 6px 20px rgba(124,58,237,0.5)'; b.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'linear-gradient(135deg, #7c3aed, #6366f1)'; b.style.boxShadow = '0 4px 16px rgba(124,58,237,0.35)'; b.style.transform = 'translateY(0)'; }}
          >
            <Download size={13} />
            Export MP4
            <ChevronRight size={11} style={{ opacity: 0.7 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Internal sub-components ───────────────────────────────────── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{
        fontSize: '0.65rem', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        color: '#3f3f46', marginBottom: 8,
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function OptionBtn({
  active, onClick, label, sub,
}: { active: boolean; onClick: () => void; label: string; sub: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 6px',
        borderRadius: 9,
        border: active
          ? '1px solid rgba(168,85,247,0.5)'
          : '1px solid rgba(255,255,255,0.06)',
        background: active
          ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(99,102,241,0.12))'
          : 'rgba(255,255,255,0.02)',
        color: active ? '#d8b4fe' : '#71717a',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.15s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        boxShadow: active ? '0 0 0 1px rgba(168,85,247,0.15) inset' : 'none',
      }}
    >
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: active ? 'white' : '#a1a1aa' }}>
        {label}
      </span>
      <span style={{ fontSize: '0.58rem', color: active ? 'rgba(216,180,254,0.7)' : '#3f3f46' }}>
        {sub}
      </span>
    </button>
  );
}
