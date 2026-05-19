import React, { useState } from 'react';
import s from './BackgroundPicker.module.css';

export interface BackgroundOption {
  id: string;
  category: 'gradient' | 'pattern' | 'solid';
  name: string;
  style: React.CSSProperties;
}

export const BACKGROUNDS: BackgroundOption[] = [
  // Gradients
  { id: 'mesh-1', category: 'gradient', name: 'Cosmic Mesh', style: { backgroundImage: 'radial-gradient(ellipse at top left, #3730a3 0%, transparent 50%), radial-gradient(ellipse at bottom right, #6d28d9 0%, transparent 50%), #0f0f23', backgroundColor: '#0f0f23', backgroundSize: 'auto' } },
  { id: 'glass-dark', category: 'gradient', name: 'Glass Dark', style: { backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%), #09090b', backgroundColor: '#09090b', backgroundSize: 'auto' } },
  { id: 'aurora', category: 'gradient', name: 'Aurora', style: { backgroundImage: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)', backgroundColor: '#10b981', backgroundSize: 'auto' } },
  { id: 'sunset', category: 'gradient', name: 'Sunset', style: { backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #db2777 100%)', backgroundColor: '#f59e0b', backgroundSize: 'auto' } },
  { id: 'ocean', category: 'gradient', name: 'Ocean Deep', style: { backgroundImage: 'linear-gradient(135deg, #0c1445 0%, #1e3a8a 50%, #0e7490 100%)', backgroundColor: '#0c1445', backgroundSize: 'auto' } },
  { id: 'forest', category: 'gradient', name: 'Forest', style: { backgroundImage: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)', backgroundColor: '#14532d', backgroundSize: 'auto' } },
  { id: 'purple', category: 'gradient', name: 'Purple Night', style: { backgroundImage: 'linear-gradient(135deg, #1e0a3c 0%, #3b0764 50%, #1e1b4b 100%)', backgroundColor: '#1e0a3c', backgroundSize: 'auto' } },
  { id: 'rose', category: 'gradient', name: 'Rose Gold', style: { backgroundImage: 'linear-gradient(135deg, #fda4af 0%, #f43f5e 50%, #be123c 100%)', backgroundColor: '#fda4af', backgroundSize: 'auto' } },
  { id: 'mono', category: 'gradient', name: 'Monochrome', style: { backgroundImage: 'linear-gradient(135deg, #f3f4f6 0%, #9ca3af 50%, #4b5563 100%)', backgroundColor: '#f3f4f6', backgroundSize: 'auto' } },
  
  // Patterns
  { id: 'grid', category: 'pattern', name: 'Grid', style: { backgroundColor: '#111', backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: 'center' } },
  { id: 'dots', category: 'pattern', name: 'Dots', style: { backgroundColor: '#111', backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '16px 16px', backgroundPosition: 'center' } },
  { id: 'stripes', category: 'pattern', name: 'Stripes', style: { backgroundColor: '#111', backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 8px)', backgroundSize: 'auto', backgroundPosition: '0 0' } },
  { id: 'checker', category: 'pattern', name: 'Checker', style: { backgroundColor: '#111', backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.05) 75%, rgba(255,255,255,0.05)), repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.05) 75%, rgba(255,255,255,0.05))', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' } },
  
  // Solids
  { id: 'black', category: 'solid', name: 'Black', style: { backgroundColor: '#000000', backgroundImage: 'none', backgroundSize: 'auto' } },
  { id: 'white', category: 'solid', name: 'White', style: { backgroundColor: '#ffffff', backgroundImage: 'none', backgroundSize: 'auto' } },
  { id: 'zinc', category: 'solid', name: 'Zinc', style: { backgroundColor: '#18181b', backgroundImage: 'none', backgroundSize: 'auto' } },
  { id: 'slate', category: 'solid', name: 'Slate', style: { backgroundColor: '#0f172a', backgroundImage: 'none', backgroundSize: 'auto' } },
  { id: 'transparent', category: 'solid', name: 'Transparent', style: { backgroundColor: 'transparent', backgroundImage: 'none', backgroundSize: 'auto' } },
];

interface BackgroundPickerProps {
  value: BackgroundOption;
  onChange: (bg: BackgroundOption) => void;
  onCustomChange?: (color: string) => void;
}

export const BackgroundPicker: React.FC<BackgroundPickerProps> = ({ value, onChange, onCustomChange }) => {
  const [tab, setTab] = useState<'gradient' | 'pattern' | 'solid'>('gradient');

  const filtered = BACKGROUNDS.filter(b => b.category === tab);

  return (
    <div className={s.container}>
      <div className={s.tabs}>
        <button className={tab === 'gradient' ? s.activeTab : s.tab} onClick={() => setTab('gradient')}>Gradients</button>
        <button className={tab === 'pattern' ? s.activeTab : s.tab} onClick={() => setTab('pattern')}>Patterns</button>
        <button className={tab === 'solid' ? s.activeTab : s.tab} onClick={() => setTab('solid')}>Solids</button>
      </div>
      <div className={s.swatches}>
        {filtered.map(bg => (
          <button
            key={bg.id}
            title={bg.name}
            className={`${s.swatch} ${value.id === bg.id ? s.swatchActive : ''}`}
            style={bg.style}
            onClick={() => onChange(bg)}
          />
        ))}
      </div>
    </div>
  );
};
