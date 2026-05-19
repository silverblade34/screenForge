import React from 'react';
import s from './DeviceFrame.module.css';

export type DeviceModel = 
  | 'iphone-17-pro' | 'iphone-17' | 'iphone-16-pro' | 'iphone-16' 
  | 'iphone-15-pro' | 'iphone-15' | 'iphone-14-pro' | 'iphone-classic'
  | 'browser' | 'macbook-pro' | 'none';

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
}

const frameColors: Record<FrameColor, { base: string, highlight: string, shadow: string, metallicGradient: string }> = {
  spaceBlack: { base: '#151516', highlight: '#3a3a3c', shadow: '#0b0b0c', metallicGradient: 'linear-gradient(135deg, #2c2d30 0%, #151516 50%, #0b0b0c 100%)' },
  spaceGray: { base: '#3a3d40', highlight: '#63666a', shadow: '#222326', metallicGradient: 'linear-gradient(135deg, #53565a 0%, #3a3d40 50%, #222326 100%)' },
  silver: { base: '#d1d5db', highlight: '#f3f4f6', shadow: '#9ca3af', metallicGradient: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 50%, #d1d5db 100%)' },
  midnight: { base: '#1e293b', highlight: '#334155', shadow: '#0f172a', metallicGradient: 'linear-gradient(135deg, #2e3b4e 0%, #1e293b 50%, #0f172a 100%)' },
  starlight: { base: '#e2dcd0', highlight: '#f4f0ea', shadow: '#c4bcae', metallicGradient: 'linear-gradient(135deg, #faf8f5 0%, #e2dcd0 50%, #c4bcae 100%)' },
  naturalTitanium: { base: '#a8a297', highlight: '#c7c2b9', shadow: '#857f75', metallicGradient: 'linear-gradient(135deg, #bebaa7 0%, #a8a297 50%, #857f75 100%)' },
  titaniumBlue: { base: '#374754', highlight: '#55697a', shadow: '#242f38', metallicGradient: 'linear-gradient(135deg, #475a6b 0%, #374754 50%, #242f38 100%)' },
  gold: { base: '#e5c199', highlight: '#f5dec2', shadow: '#b28e67', metallicGradient: 'linear-gradient(135deg, #fcead2 0%, #e5c199 50%, #b28e67 100%)' },
  
  // Legacy colors for backwards compatibility
  skyBlue: { base: '#050A10', highlight: '#8AB4F8', shadow: '#174EA6', metallicGradient: 'linear-gradient(135deg, #a5c7f7 0%, #8AB4F8 50%, #174EA6 100%)' },
  lightGold: { base: '#0F0D0A', highlight: '#FDE293', shadow: '#B08D55', metallicGradient: 'linear-gradient(135deg, #fcead2 0%, #e5c199 50%, #b28e67 100%)' },
  cloudWhite: { base: '#0A0A0A', highlight: '#F2F2F7', shadow: '#D1D1D6', metallicGradient: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #d1d5db 100%)' },
  titanium: { base: '#0A0A0A', highlight: '#AEAEB2', shadow: '#636366', metallicGradient: 'linear-gradient(135deg, #c7c2b9 0%, #a8a297 50%, #636366 100%)' },
};

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ 
  model, 
  color = 'spaceBlack', 
  children, 
  scale = 100, 
  rotateX = 0, 
  rotateY = 0, 
  shadow = 30,
  className = '',
  style = {}
}) => {
  const c = frameColors[color] || frameColors.spaceBlack;
  
  const containerStyle: React.CSSProperties = {
    transform: `scale(${scale / 100}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
    ...style
  };

  const shadowStyle: React.CSSProperties = {
    boxShadow: `0 ${shadow}px ${shadow * 2}px rgba(0,0,0,${Math.min(shadow / 100, 0.8)})`
  };

  if (model === 'none') {
    return (
      <div className={`${s.container} ${className}`} style={containerStyle}>
        <div className={s.shadow} style={shadowStyle} />
        <div className={s.content} style={{ borderRadius: 16 }}>
          {children}
        </div>
      </div>
    );
  }

  if (model === 'browser') {
    return (
      <div className={`${s.container} ${className}`} style={{ ...containerStyle }}>
        <div className={s.shadow} style={shadowStyle} />
        <div className={s.browserFrame} style={{ '--frame-base': c.base, '--frame-highlight': c.highlight, '--frame-width': '600px' } as React.CSSProperties}>
          <div className={s.browserHeader}>
            <div className={s.browserDot} style={{ background: '#ff5f57' }} />
            <div className={s.browserDot} style={{ background: '#febc2e' }} />
            <div className={s.browserDot} style={{ background: '#28c840' }} />
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
      <div className={`${s.container} ${className}`} style={{ ...containerStyle }}>
        <div className={s.shadow} style={shadowStyle} />
        <div className={s.macbookFrame} style={{ '--frame-width': '600px', '--frame-base': c.base, '--frame-highlight': c.highlight, '--frame-shadow': c.shadow, '--metallic-gradient': c.metallicGradient } as React.CSSProperties}>
          <div className={s.macbookScreen}>
            <div className={s.macbookCamera} />
            <div className={s.content} style={{ borderRadius: 4 }}>
              {children}
              <div className={s.reflection} />
            </div>
          </div>
          <div className={s.macbookBase} style={{ '--frame-base': c.base, '--frame-shadow': c.shadow, '--metallic-gradient': c.metallicGradient } as React.CSSProperties}>
            <div className={s.macbookNotch} style={{ '--frame-shadow': c.shadow } as React.CSSProperties} />
          </div>
        </div>
      </div>
    );
  }

  // iPhones
  const isDynamicIsland = model.includes('pro') || model === 'iphone-15' || model === 'iphone-16' || model === 'iphone-17';
  const hasActionBtn = model.includes('15-pro') || model.includes('16') || model.includes('17');
  const hasCameraControl = model.includes('16') || model.includes('17');
  
  // Specific DI widths for 320px frame
  let diWidth = '100px';
  if (model.includes('17-pro') || model.includes('16-pro')) diWidth = '105px';
  else if (model.includes('15') && !model.includes('pro')) diWidth = '95px';

  // Specific aspect ratios
  let aspectRatio = 0.461; // 17 Pro, 15 Pro
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
    <div className={`${s.container} ${className}`} style={{ ...containerStyle }}>
      <div className={s.shadow} style={shadowStyle} />
      <div className={s.iphoneFrame} style={iphoneVars}>
        {/* Hardware Buttons */}
        <div className={`${s.sideButton} ${s.powerBtn}`} />
        <div className={`${s.sideButton} ${s.volUpBtn}`} />
        <div className={`${s.sideButton} ${s.volDownBtn}`} />
        {hasActionBtn && <div className={`${s.sideButton} ${s.actionBtn}`} />}
        {hasCameraControl && <div className={`${s.sideButton} ${s.cameraControlBtn}`} />}

        {/* Notches / Islands */}
        {isDynamicIsland ? (
          <div className={s.dynamicIsland} />
        ) : (
          <div className={s.iphoneNotch} />
        )}

        {/* Screen */}
        <div className={s.content} style={{ borderRadius: '34px' }}>
          {children}
          <div className={s.reflection} />
        </div>
      </div>
    </div>
  );
};
