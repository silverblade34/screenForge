'use client';

import { Link as RouterLink, useLocation } from 'react-router-dom';
const Link = ({ href, children, ...props }: any) => <RouterLink to={href} {...props}>{children}</RouterLink>;
import { useTheme } from '@/lib/theme-provider';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon, Sun, Menu, X, ChevronDown,
  FileText, Table, Camera, GitBranch,
  Code, BarChart3, Sparkles, Zap, Smartphone, MonitorPlay
} from 'lucide-react';
import s from './Navbar.module.css';

export const ALL_TOOLS = [
  { name: 'Mockup Studio', href: '/mockup-studio', icon: Smartphone, desc: 'Crea mockups de dispositivos' },
  { name: 'Device Animation', href: '/device-animation', icon: MonitorPlay, desc: 'Genera videos de mockups' },
];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const isToolRoute = pathname?.startsWith('/mockup-studio') || pathname?.startsWith('/device-animation');

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isToolRoute) return null;

  return (
    <nav
      className={s.nav}
      style={{
        background: theme === 'dark' ? 'rgba(9,9,11,0.85)' : 'rgba(250,250,250,0.85)',
      }}
    >
      <div className={isToolRoute ? s.innerFull : s.inner}>
        <div className={s.bar}>

          {/* Logo */}
          <Link href="/" className={s.logo}>
            <div className={s.logoIcon}>
              <Zap style={{ width: 16, height: 16, color: 'white' }} />
            </div>
            <span className={s.logoText}>
              Render<span className={s.logoAccent}>Studio</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className={s.desktopLinks}>
            <Link href="/" className={s.navLink}>Inicio</Link>

            {/* Tools dropdown */}
            <div className={s.dropdownWrapper} ref={dropdownRef}>
              <button className={s.dropdownTrigger} onClick={() => setToolsOpen(!toolsOpen)}>
                Herramientas
                <ChevronDown className={`${s.chevron} ${toolsOpen ? s.chevronOpen : ''}`} />
              </button>

              <AnimatePresence>
                {toolsOpen && (
                  <motion.div
                    className={s.dropdown}
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    {ALL_TOOLS.map((tool) => (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className={s.dropdownItem}
                        onClick={() => setToolsOpen(false)}
                      >
                        <div className={s.dropdownIcon}>
                          <tool.icon style={{ width: 14, height: 14, color: 'var(--primary)' }} />
                        </div>
                        <div>
                          <div className={s.dropdownItemName}>{tool.name}</div>
                          <div className={s.dropdownItemDesc}>{tool.desc}</div>
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/#pricing" className={s.navLink}>Pricing</Link>
            <Link href="/docs" className={s.navLink}>Docs</Link>
          </div>

          {/* Right actions */}
          <div className={s.rightActions}>
            <button className={s.iconBtn} onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark'
                ? <Sun style={{ width: 16, height: 16 }} />
                : <Moon style={{ width: 16, height: 16 }} />
              }
            </button>

            <Link href="/mockup-studio" className={s.ctaBtn}>
              <Sparkles style={{ width: 14, height: 14 }} />
              Comenzar
            </Link>

            <button className={s.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen
                ? <X style={{ width: 20, height: 20 }} />
                : <Menu style={{ width: 20, height: 20 }} />
              }
            </button>
          </div>

        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className={s.mobileMenu}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className={s.mobileMenuInner}>
              <Link href="/" className={s.mobileLink} onClick={() => setMenuOpen(false)}>Inicio</Link>
              {ALL_TOOLS.map(t => (
                <Link key={t.href} href={t.href} className={s.mobileLink} onClick={() => setMenuOpen(false)}>
                  {t.name}
                </Link>
              ))}
              <Link href="/#pricing" className={s.mobileLink} onClick={() => setMenuOpen(false)}>Pricing</Link>
              <Link href="/docs" className={s.mobileLink} onClick={() => setMenuOpen(false)}>Docs</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
