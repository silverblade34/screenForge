import React from 'react';
import { Smartphone, Laptop, Globe, Box, Tablet } from 'lucide-react';
import { DeviceModel } from './DeviceFrame';
import s from './DeviceSelector.module.css';

interface DeviceOption {
  value: DeviceModel;
  label: string;
  icon: React.ElementType;
}

const DEVICE_GROUPS: { name: string; options: DeviceOption[] }[] = [
  {
    name: 'iPhones',
    options: [
      { value: 'iphone-17-pro', label: '17 Pro', icon: Smartphone },
      { value: 'iphone-17', label: '17', icon: Smartphone },
      { value: 'iphone-16-pro', label: '16 Pro', icon: Smartphone },
      { value: 'iphone-15-pro', label: '15 Pro', icon: Smartphone },
      { value: 'iphone-classic', label: 'Classic', icon: Smartphone },
    ],
  },
  {
    name: 'Desktop & Other',
    options: [
      { value: 'browser', label: 'Browser', icon: Globe },
      { value: 'macbook-pro', label: 'MacBook', icon: Laptop },
      { value: 'none', label: 'None', icon: Box },
    ],
  },
];

interface DeviceSelectorProps {
  value: DeviceModel;
  onChange: (device: DeviceModel) => void;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({ value, onChange }) => {
  return (
    <div className={s.container}>
      {DEVICE_GROUPS.map(group => (
        <div key={group.name} className={s.group}>
          <div className={s.groupName}>{group.name}</div>
          <div className={s.grid}>
            {group.options.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  className={`${s.btn} ${value === opt.value ? s.btnActive : ''}`}
                  onClick={() => onChange(opt.value)}
                  title={opt.label}
                >
                  <Icon className={s.icon} />
                  <span className={s.label}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
