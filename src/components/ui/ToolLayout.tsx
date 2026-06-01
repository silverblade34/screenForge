'use client';

import { Link as RouterLink } from 'react-router-dom';
const Link = ({ href, children, ...props }: any) => <RouterLink to={href} {...props}>{children}</RouterLink>;
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, Zap, Moon, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ALL_TOOLS } from '@/components/layout/Navbar';
import { useTheme } from '@/lib/theme-provider';
import s from './ToolLayout.module.css';

interface ToolLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function ToolLayout({ title, description, icon: Icon, children, actions }: ToolLayoutProps) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <Link href="/" className={s.logoLink}>
            <Zap style={{ width: 14, height: 14, color: 'var(--primary)' }} />
          </Link>
          <div className={s.divider} />
          
          <div className={s.switcherContainer} ref={dropdownRef}>
            <button className={s.switcherTrigger} onClick={() => setSwitcherOpen(!switcherOpen)}>
              <div className={s.toolIcon}>
                <Icon style={{ width: 14, height: 14, color: 'white' }} />
              </div>
              <div className={s.titleBlock}>
                <h1 className={s.title}>{title}</h1>
                <ChevronDown className={`${s.chevron} ${switcherOpen ? s.chevronOpen : ''}`} />
              </div>
            </button>

            {switcherOpen && (
              <div className={s.switcherDropdown}>
                {ALL_TOOLS.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className={`${s.switcherItem} ${tool.name === title ? s.activeItem : ''}`}
                    onClick={() => setSwitcherOpen(false)}
                  >
                    <tool.icon className={s.itemIcon} style={{ width: 14, height: 14 }} />
                    <div className={s.itemContent}>
                      <div className={s.itemName}>{tool.name}</div>
                      <div className={s.itemDesc}>{tool.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={s.headerRight}>
          <button className={s.themeBtn} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          {actions && (
            <div className={s.headerActions}>
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={s.content}>
        {children}
      </div>
    </div>
  );
}

/* ── Split Panel ─────────────────────────────────────────── */
interface SplitPanelProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftLabel?: string;
  rightLabel?: string;
}

export function SplitPanel({ left, right, leftLabel = 'Editor', rightLabel = 'Preview' }: SplitPanelProps) {
  const [leftWidthPct, setLeftWidthPct] = useState(25);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const pct = (e.clientX / window.innerWidth) * 100;
      const newWidthPct = Math.max(15, Math.min(pct, 50));
      setLeftWidthPct(newWidthPct);
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = () => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div className={s.splitPanel}>
      <div className={s.panelLeft} style={{ width: `${leftWidthPct}%`, minWidth: 'min(240px, 40%)', maxWidth: '60%' }}>
        <div className={s.panelLabel}>{leftLabel}</div>
        <div className={s.panelBody}>{left}</div>
      </div>
      
      <div 
        className={s.resizer} 
        onMouseDown={handleMouseDown}
      />

      <div className={s.panelRight}>
        <div className={s.panelLabel}>{rightLabel}</div>
        <div className={s.previewBody}>{right}</div>
      </div>
    </div>
  );
}

/* ── Button ──────────────────────────────────────────────── */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: '0.3rem 0.6rem', fontSize: '0.75rem' },
  md: { padding: '0.4rem 0.75rem', fontSize: '0.8rem' },
  lg: { padding: '0.6rem 1rem', fontSize: '0.9rem' },
};

export function Button({ variant = 'secondary', size = 'md', children, style, disabled, ...props }: ButtonProps) {
  const variantClass = variant === 'primary' ? s.btnPrimary : variant === 'ghost' ? s.btnGhost : s.btnSecondary;
  return (
    <button
      className={`${s.btn} ${variantClass} ${disabled ? s.btnDisabled : ''}`}
      style={{ ...sizeStyles[size], ...style }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

/* ── Textarea ────────────────────────────────────────────── */
export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${s.textarea} ${className || ''}`} {...props} />;
}

/* ── Select ──────────────────────────────────────────────── */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, ...props }: SelectProps) {
  return (
    <div className={s.selectWrapper}>
      {label && <label className={s.selectLabel}>{label}</label>}
      <select className={s.select} {...props}>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Tool Card ───────────────────────────────────────────── */
export function ToolCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={s.toolCard}
    >
      {children}
    </motion.div>
  );
}
