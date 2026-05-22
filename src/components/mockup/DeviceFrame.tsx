import React from 'react';
import s from './DeviceFrame.module.css';

export type DeviceModel = 
  | 'iphone-17-pro' | 'iphone-17' | 'iphone-16-pro' | 'iphone-16' 
  | 'iphone-15-pro' | 'iphone-15' | 'iphone-14-pro' | 'iphone-classic'
  | 'browser' | 'macbook-pro' | 'none';

export type BrowserVariant = 'safari-light' | 'safari-dark' | 'chrome-light' | 'chrome-dark' | 'arc-light' | 'arc-dark';

export type FrameColor = 
  | 'spaceBlack' 
  | 'spaceGray' 
  | 'silver' 
  | 'midnight' 
  | 'starlight' 
  | 'titaniumBlue' 
  | 'naturalTitanium' 
  | 'gold'
  | 'skyBlue'
  | 'lightGold'
  | 'cloudWhite'
  | 'titanium';

export interface DeviceFrameProps {
  model: DeviceModel;
  color?: FrameColor;
  children: React.ReactNode;
  scale?: number;
  rotateX?: number;
  rotateY?: number;
  shadow?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Show ambient glow behind the device. Default: true */
  glow?: boolean;
  /** Show ground reflection below the device. Default: true */
  reflection?: boolean;
  browserVariant?: BrowserVariant;
  browserUrl?: string;
  browserScale?: number;
}

const frameColors: Record<FrameColor, {
  base: string; highlight: string; shadow: string; metallicGradient: string; glowColor: string;
}> = {
  spaceBlack:      { base: '#151516', highlight: '#3a3a3c', shadow: '#0b0b0c', metallicGradient: 'linear-gradient(135deg, #2c2d30 0%, #151516 50%, #0b0b0c 100%)', glowColor: 'rgba(124,58,237,0.22)' },
  spaceGray:       { base: '#3a3d40', highlight: '#63666a', shadow: '#222326', metallicGradient: 'linear-gradient(135deg, #53565a 0%, #3a3d40 50%, #222326 100%)', glowColor: 'rgba(100,116,139,0.2)' },
  silver:          { base: '#d1d5db', highlight: '#f3f4f6', shadow: '#9ca3af', metallicGradient: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 50%, #d1d5db 100%)', glowColor: 'rgba(148,163,184,0.18)' },
  midnight:        { base: '#1e293b', highlight: '#334155', shadow: '#0f172a', metallicGradient: 'linear-gradient(135deg, #2e3b4e 0%, #1e293b 50%, #0f172a 100%)', glowColor: 'rgba(56,189,248,0.18)' },
  starlight:       { base: '#e2dcd0', highlight: '#f4f0ea', shadow: '#c4bcae', metallicGradient: 'linear-gradient(135deg, #faf8f5 0%, #e2dcd0 50%, #c4bcae 100%)', glowColor: 'rgba(253,224,144,0.14)' },
  naturalTitanium: { base: '#a8a297', highlight: '#c7c2b9', shadow: '#857f75', metallicGradient: 'linear-gradient(135deg, #bebaa7 0%, #a8a297 50%, #857f75 100%)', glowColor: 'rgba(168,162,151,0.18)' },
  titaniumBlue:    { base: '#374754', highlight: '#55697a', shadow: '#242f38', metallicGradient: 'linear-gradient(135deg, #475a6b 0%, #374754 50%, #242f38 100%)', glowColor: 'rgba(14,165,233,0.2)' },
  gold:            { base: '#e5c199', highlight: '#f5dec2', shadow: '#b28e67', metallicGradient: 'linear-gradient(135deg, #fcead2 0%, #e5c199 50%, #b28e67 100%)', glowColor: 'rgba(245,158,11,0.22)' },
  skyBlue:         { base: '#050A10', highlight: '#8AB4F8', shadow: '#174EA6', metallicGradient: 'linear-gradient(135deg, #a5c7f7 0%, #8AB4F8 50%, #174EA6 100%)', glowColor: 'rgba(96,165,250,0.2)' },
  lightGold:       { base: '#0F0D0A', highlight: '#FDE293', shadow: '#B08D55', metallicGradient: 'linear-gradient(135deg, #fcead2 0%, #e5c199 50%, #b28e67 100%)', glowColor: 'rgba(253,186,74,0.2)' },
  cloudWhite:      { base: '#0A0A0A', highlight: '#F2F2F7', shadow: '#D1D1D6', metallicGradient: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #d1d5db 100%)', glowColor: 'rgba(241,245,249,0.12)' },
  titanium:        { base: '#0A0A0A', highlight: '#AEAEB2', shadow: '#636366', metallicGradient: 'linear-gradient(135deg, #c7c2b9 0%, #a8a297 50%, #636366 100%)', glowColor: 'rgba(168,162,151,0.18)' },
};

/* ─── Internal: renders the raw device frame (no wrapper) ──── */
function RawFrame({
  model, color = 'spaceBlack', children, shadowIntensity, browserVariant = 'safari-light', browserUrl = '', browserScale = 100
}: {
  model: DeviceModel; color: FrameColor; children: React.ReactNode; shadowIntensity: number; browserVariant?: BrowserVariant; browserUrl?: string; browserScale?: number;
}) {
  const c = frameColors[color] || frameColors.spaceBlack;

  const shadowStyle: React.CSSProperties = {
    boxShadow: `0 ${shadowIntensity}px ${shadowIntensity * 2}px rgba(0,0,0,${Math.min(shadowIntensity / 100, 0.8)})`,
  };

  if (model === 'none') {
    return (
      <div className={s.container}>
        <div className={s.shadow} style={shadowStyle} data-export-hide="true" />
        <div className={s.content} style={{ borderRadius: 16 }}>{children}</div>
      </div>
    );
  }

  if (model === 'browser') {
    const isDark = browserVariant.includes('-dark');
    const isSafari = browserVariant.includes('safari');
    const isChrome = browserVariant.includes('chrome');
    const isArc = browserVariant.includes('arc');

    const headerBg = isDark ? (isSafari ? '#282828' : isChrome ? '#202124' : '#1c1c1e') : (isSafari ? '#f6f6f6' : isChrome ? '#dee1e6' : '#ffffff');
    const barBg = isDark ? (isSafari ? '#3a3a3c' : isChrome ? '#323639' : '#2c2c2e') : (isSafari ? '#ffffff' : isChrome ? '#ffffff' : '#f4f5f5');
    const textColor = isDark ? '#ffffff' : '#000000';

    return (
      <div className={s.container}>
        <div className={s.shadow} style={shadowStyle} data-export-hide="true" />
        <div
          className={s.browserFrame}
          style={{ '--frame-base': headerBg, '--frame-width': `${600 * (browserScale / 100)}px` } as React.CSSProperties}
        >
          <div className={s.browserHeader} style={{ background: headerBg, justifyContent: isSafari ? 'center' : 'flex-start', padding: isArc ? '8px 16px' : '12px 16px', position: 'relative' }}>
            <div style={{ display: 'flex', gap: 6, position: isSafari ? 'absolute' : 'static', left: 16 }}>
              <div className={s.browserDot} style={{ background: '#ff5f57' }} />
              <div className={s.browserDot} style={{ background: '#febc2e' }} />
              <div className={s.browserDot} style={{ background: '#28c840' }} />
            </div>
            
            {!isArc && (
              <div style={{ background: barBg, borderRadius: 6, padding: '4px 12px', fontSize: '10px', color: textColor, opacity: 0.6, width: isSafari ? '240px' : '100%', maxWidth: '300px', marginLeft: isChrome ? 16 : 0, textAlign: isSafari ? 'center' : 'left', display: 'flex', alignItems: 'center' }}>
                {browserUrl || 'example.com'}
              </div>
            )}
          </div>
          <div className={s.browserContent}>
            {children}
            <div className={s.reflection} />
          </div>
        </div>
      </div>
    );
  }

  if (model === 'macbook-pro') {
    return (
      <div className={s.container}>
        <div className={s.shadow} style={shadowStyle} data-export-hide="true" />
        <div
          className={s.macbookFrame}
          style={{ '--frame-width': '600px', '--frame-base': c.base, '--frame-highlight': c.highlight, '--frame-shadow': c.shadow, '--metallic-gradient': c.metallicGradient } as React.CSSProperties}
        >
          <div className={s.macbookScreen}>
            <div className={s.macbookCamera} />
            <div className={s.content} style={{ borderRadius: 4 }}>
              {children}
              <div className={s.reflection} />
            </div>
          </div>
          <div
            className={s.macbookBase}
            style={{ '--frame-base': c.base, '--frame-shadow': c.shadow, '--metallic-gradient': c.metallicGradient } as React.CSSProperties}
          >
            <div className={s.macbookNotch} style={{ '--frame-shadow': c.shadow } as React.CSSProperties} />
          </div>
        </div>
      </div>
    );
  }

  // ── iPhones ──────────────────────────────────────────────────
  const isDynamicIsland = model.includes('pro') || model === 'iphone-15' || model === 'iphone-16' || model === 'iphone-17';
  const hasActionBtn = model.includes('15-pro') || model.includes('16') || model.includes('17');
  const hasCameraControl = model.includes('16') || model.includes('17');

  let diWidth = '100px';
  if (model.includes('17-pro') || model.includes('16-pro')) diWidth = '105px';
  else if (model.includes('15') && !model.includes('pro')) diWidth = '95px';

  let aspectRatio = 0.461;
  if (model === 'iphone-17' || model === 'iphone-16' || model === 'iphone-15') aspectRatio = 0.462;
  if (model === 'iphone-16-pro') aspectRatio = 0.460;

  const iphoneVars = {
    '--frame-width': '320px',
    '--frame-base': c.base,
    '--frame-highlight': c.highlight,
    '--frame-shadow': c.shadow,
    '--metallic-gradient': c.metallicGradient,
    '--di-width': diWidth,
    '--aspect-ratio': aspectRatio,
    '--frame-radius': '44px',
    '--frame-padding': '12px',
  } as React.CSSProperties;

  return (
    <div className={s.container}>
      <div className={s.shadow} style={shadowStyle} data-export-hide="true" />
      <div className={s.iphoneFrame} style={iphoneVars}>
        {/* Animated rim light */}
        <div className={s.rimLight} aria-hidden="true" />

        {/* Hardware Buttons */}
        <div className={`${s.sideButton} ${s.powerBtn}`} />
        <div className={`${s.sideButton} ${s.volUpBtn}`} />
        <div className={`${s.sideButton} ${s.volDownBtn}`} />
        {hasActionBtn && <div className={`${s.sideButton} ${s.actionBtn}`} />}
        {hasCameraControl && <div className={`${s.sideButton} ${s.cameraControlBtn}`} />}

        {/* Notch / Dynamic Island */}
        {isDynamicIsland ? (
          <div className={s.dynamicIsland} />
        ) : (
          <div className={s.iphoneNotch} />
        )}

        {/* Screen */}
        <div className={s.content} style={{ borderRadius: '34px' }}>
          {children}
          <div className={s.reflection} data-export-hide="true" />
        </div>
      </div>
    </div>
  );
}

/* ─── Public Component ──────────────────────────────────────── */
export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  model,
  color = 'spaceBlack',
  children,
  scale = 100,
  rotateX = 0,
  rotateY = 0,
  shadow = 30,
  className = '',
  style = {},
  glow = true,
  reflection = false,
  browserVariant,
  browserUrl,
  browserScale,
}) => {
  const c = frameColors[color] || frameColors.spaceBlack;

  const containerStyle: React.CSSProperties = {
    transform: `scale(${scale / 100}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
    transformStyle: 'preserve-3d',
    ...style,
  };

  /* When 3D rotation is active, disable reflection to avoid visual artifacts */
  const showReflection = reflection && rotateX === 0 && rotateY === 0;

  return (
    <div
      className={`${s.bloomWrapper} ${className}`}
      style={containerStyle}
    >
      {/* Ambient glow behind device — hidden during PNG export */}
      {glow && (
        <div
          className={s.ambientGlow}
          aria-hidden="true"
          data-export-hide="true"
          style={{ '--device-glow-color': c.glowColor } as React.CSSProperties}
        />
      )}

      {/* Main device — z-index: 1 so it sits above glow */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <RawFrame model={model} color={color} shadowIntensity={shadow} browserVariant={browserVariant} browserUrl={browserUrl} browserScale={browserScale}>
          {children}
        </RawFrame>
      </div>

      {/* Ground reflection */}
      {showReflection && (
        <div className={s.groundReflection} aria-hidden="true" data-export-hide="true">
          <div className={s.groundReflectionInner}>
            <RawFrame model={model} color={color} shadowIntensity={0} browserVariant={browserVariant} browserUrl={browserUrl} browserScale={browserScale}>
              {children}
            </RawFrame>
          </div>
        </div>
      )}
    </div>
  );
};
