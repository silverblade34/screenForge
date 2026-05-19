import React from 'react';
import s from './ControlSlider.module.css';

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
}

export const ControlSlider: React.FC<ControlSliderProps> = ({
  label, value, min, max, step = 1, unit = '', onChange
}) => {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={s.container}>
      {/* Visual track representing the value */}
      <div className={s.fill} style={{ width: `${percent}%` }} />
      
      <div className={s.content}>
        <span className={s.label}>{label}</span>
        <div className={s.valueGroup}>
          <div className={s.divider} />
          <span className={s.value}>
            {value}{unit}
          </span>
        </div>
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={s.hiddenSlider}
      />
    </div>
  );
};
