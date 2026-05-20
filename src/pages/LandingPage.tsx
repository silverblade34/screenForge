import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Monitor, Clapperboard, Download, Layers, Zap,
  ArrowUpRight, Check, Film, Move, Sparkles,
} from 'lucide-react';
import s from './LandingPage.module.css';

/* ── TRANSLATIONS ─────────────────────────────────────────── */
const COPY = {
  es: {
    nav: {
      tools: 'Herramientas',
      workflow: 'Flujo',
      pricing: 'Precios',
      signin: 'Iniciar sesión',
      launch: 'Abrir app →',
    },

    badge: 'Motor de Presentaciones UI Cinematográficas',

    heroTitle: 'Convierte interfaces',
    heroAccent: 'en experiencias cinematográficas.',

    heroSub:
      'Crea showcases animados, visuales de lanzamiento y presentaciones premium de apps directamente desde tu navegador. Diseñado para exports de Figma — sin plugins, sin instalaciones y sin After Effects.',

    cta1: 'Empezar a crear',
    cta2: 'Ver animaciones',

    meta: [
      'Diseñado para exports de Figma',
      '100% en el navegador',
      'Gratis para empezar',
    ],

    stats: [
      { value: '11', label: 'Animaciones cinematográficas' },
      { value: '8', label: 'Marcos de dispositivo' },
      { value: '100%', label: 'Basado en navegador' },
      { value: '3×', label: 'Resolución máxima' },
    ],

    toolsLabel: 'Herramientas',

    toolsTitle: 'Motion design para productos digitales,\nsin complejidad.',

    toolsSub:
      'Todo lo que necesitas para transformar capturas estáticas en visuales de lanzamiento con movimiento, profundidad y narrativa cinematográfica.',

    tools: [
      {
        title: 'Mockup Studio',
        desc:
          'Diseña composiciones premium de producto con dispositivos 3D, fondos cinematográficos, iluminación profesional y layouts multi-pantalla.',
        tags: [
          'Composición 3D',
          'Layouts Multi-screen',
          'Fondos Cinemáticos',
          'Export PNG',
        ],
      },
      {
        title: 'Device Animation',
        desc:
          'Anima interfaces con cámara virtual, timeline multi-escena, presets de movimiento cinematográfico y control total del ritmo visual.',
        tags: [
          'Timeline',
          'Cámara Virtual',
          'Motion Presets',
          'Escenas',
        ],
      },
    ],

    featuresLabel: 'Características',

    features: [
      {
        title: 'Sin instalaciones',
        desc:
          'Corre completamente en tu navegador. Sin plugins, descargas ni configuraciones complicadas.',
      },
      {
        title: 'Timeline multi-escena',
        desc:
          'Construye secuencias visuales dinámicas con control independiente por escena.',
      },
      {
        title: 'Animaciones cinematográficas',
        desc:
          'Órbita, dolly zoom, paralaje, reveal y movimientos inspirados en trailers de producto.',
      },
      {
        title: 'Cámara virtual',
        desc:
          'Controla zoom, paneo, inclinación y profundidad para crear movimiento profesional.',
      },
      {
        title: 'Fondos premium',
        desc:
          'Gradientes oscuros, iluminación suave y estilos visuales listos para cualquier marca.',
      },
      {
        title: 'Listo para publicar',
        desc:
          'Exporta assets preparados para Product Hunt, landing pages, redes sociales y showcases.',
      },
    ],

    workflowLabel: 'Cómo funciona',

    workflowTitle: 'De export de Figma\na showcase cinematográfico.',

    workflowSub:
      'Cinco pasos para convertir una pantalla estática en una presentación visual lista para lanzar tu producto.',

    steps: [
      {
        num: '01',
        title: 'Elige un dispositivo',
        desc:
          'Selecciona entre iPhone, MacBook, navegador o una composición sin marco.',
      },
      {
        num: '02',
        title: 'Sube tu interfaz',
        desc:
          'Importa una captura desde Figma o cualquier diseño en PNG, JPG o WebP.',
      },
      {
        num: '03',
        title: 'Diseña la escena',
        desc:
          'Configura profundidad, iluminación, rotación 3D, sombras y composición visual.',
      },
      {
        num: '04',
        title: 'Añade movimiento',
        desc:
          'Aplica animaciones cinematográficas, cámara virtual y transiciones fluidas.',
      },
      {
        num: '05',
        title: 'Exporta y publica',
        desc:
          'Descarga visuales listos para Product Hunt, redes sociales, sitios web o demos de producto.',
      },
    ],

    pricingLabel: 'Precios',

    pricingTitle: 'Simple, moderno y transparente.',

    pricingSub:
      'Empieza gratis y desbloquea exports premium cuando necesites más potencia.',

    pricing: [
      {
        tier: 'Gratis',
        price: '$0',
        period: '/mes',
        featured: false,

        desc:
          'Perfecto para probar ScreenForge y crear tus primeros visuales cinematográficos.',

        features: [
          '3 exports PNG por día',
          'Resolución máxima 1080p',
          'Animaciones básicas',
          'Marca de agua',
        ],

        cta: 'Empezar gratis',
      },

      {
        tier: 'Creator',
        price: '$9',
        period: '/mes',
        featured: true,

        desc:
          'Ideal para diseñadores, indie hackers y equipos que publican constantemente.',

        features: [
          'Exports ilimitados',
          'Resolución 4K (3×)',
          'Todos los motion presets',
          'Sin marca de agua',
          'Export prioritario',
        ],

        cta: 'Empezar Creator',
      },

      {
        tier: 'Studio',
        price: '$29',
        period: '/mes',
        featured: false,

        desc:
          'Pensado para agencias y equipos que crean assets visuales a gran escala.',

        features: [
          'Todo lo de Creator',
          'Exports en lote',
          'Presets personalizados',
          'Acceso anticipado',
          'Soporte dedicado',
        ],

        cta: 'Empezar Studio',
      },
    ],

    ctaTitle: 'Haz que tu producto',
    ctaAccent: 'se vea increíble.',

    ctaSub:
      'Abre ScreenForge en tu navegador y transforma interfaces estáticas en visuales cinematográficos.',

    footerCopy:
      '© 2025 ScreenForge. Todos los derechos reservados.',
  },

  en: {
    nav: {
      tools: 'Tools',
      workflow: 'Workflow',
      pricing: 'Pricing',
      signin: 'Sign in',
      launch: 'Launch app →',
    },

    badge: 'Cinematic UI Presentation Engine',

    heroTitle: 'Turn static UI',
    heroAccent: 'into cinematic experiences.',

    heroSub:
      'Create animated app showcases, launch visuals, and premium product presentations directly from your browser. Built for Figma exports — no plugins, installs, or After Effects required.',

    cta1: 'Start Creating',
    cta2: 'Watch Animations',

    meta: [
      'Built for Figma exports',
      '100% browser-based',
      'Free to start',
    ],

    stats: [
      { value: '11', label: 'Cinematic animations' },
      { value: '8', label: 'Device frames' },
      { value: '100%', label: 'Browser-based' },
      { value: '3×', label: 'Max export resolution' },
    ],

    toolsLabel: 'Tools',

    toolsTitle: 'Motion design for digital products,\nwithout the complexity.',

    toolsSub:
      'Everything you need to transform static screenshots into cinematic launch visuals with motion, depth, and storytelling.',

    tools: [
      {
        title: 'Mockup Studio',
        desc:
          'Design premium product compositions with 3D devices, cinematic backgrounds, professional lighting, and multi-screen layouts.',
        tags: [
          '3D Composition',
          'Multi-screen Layouts',
          'Cinematic Backgrounds',
          'PNG Export',
        ],
      },
      {
        title: 'Device Animation',
        desc:
          'Animate interfaces with a virtual camera system, multi-scene timeline, cinematic motion presets, and full pacing control.',
        tags: [
          'Timeline',
          'Virtual Camera',
          'Motion Presets',
          'Scenes',
        ],
      },
    ],

    featuresLabel: 'Features',

    features: [
      {
        title: 'No installs',
        desc:
          'Runs entirely in your browser. No plugins, downloads, or setup required.',
      },
      {
        title: 'Multi-scene timeline',
        desc:
          'Build dynamic visual sequences with independent scene control.',
      },
      {
        title: 'Cinematic motion',
        desc:
          'Orbit, dolly zoom, parallax, reveals, and trailer-inspired movements.',
      },
      {
        title: 'Virtual camera',
        desc:
          'Control zoom, pan, tilt, and depth to create professional motion.',
      },
      {
        title: 'Premium backgrounds',
        desc:
          'Curated gradients, lighting, and visual styles ready for any brand.',
      },
      {
        title: 'Ready to publish',
        desc:
          'Export visuals built for Product Hunt, social media, landing pages, and app showcases.',
      },
    ],

    workflowLabel: 'How it works',

    workflowTitle: 'From Figma export\nto cinematic showcase.',

    workflowSub:
      'Five steps to transform a static screen into a launch-ready visual presentation.',

    steps: [
      {
        num: '01',
        title: 'Choose a device',
        desc:
          'Select from iPhone, MacBook, browser frame, or a frameless composition.',
      },
      {
        num: '02',
        title: 'Upload your UI',
        desc:
          'Import a screenshot from Figma or any design in PNG, JPG, or WebP.',
      },
      {
        num: '03',
        title: 'Design the scene',
        desc:
          'Adjust depth, lighting, 3D rotation, shadows, and composition.',
      },
      {
        num: '04',
        title: 'Add cinematic motion',
        desc:
          'Apply motion presets, virtual camera movement, and smooth transitions.',
      },
      {
        num: '05',
        title: 'Export and publish',
        desc:
          'Download visuals ready for Product Hunt, websites, social posts, or product demos.',
      },
    ],

    pricingLabel: 'Pricing',

    pricingTitle: 'Simple, modern, transparent pricing.',

    pricingSub:
      'Start free and unlock premium exports when you need more power.',

    pricing: [
      {
        tier: 'Free',
        price: '$0',
        period: '/month',
        featured: false,

        desc:
          'Perfect for trying ScreenForge and creating your first cinematic visuals.',

        features: [
          '3 PNG exports per day',
          '1080p max resolution',
          'Basic animations',
          'Watermark included',
        ],

        cta: 'Get started free',
      },

      {
        tier: 'Creator',
        price: '$9',
        period: '/month',
        featured: true,

        desc:
          'Built for designers, indie hackers, and teams shipping product visuals regularly.',

        features: [
          'Unlimited exports',
          '4K resolution (3×)',
          'All motion presets',
          'No watermark',
          'Priority export queue',
        ],

        cta: 'Start Creator',
      },

      {
        tier: 'Studio',
        price: '$29',
        period: '/month',
        featured: false,

        desc:
          'Made for agencies and teams producing launch assets at scale.',

        features: [
          'Everything in Creator',
          'Batch exports',
          'Custom presets',
          'Early access',
          'Dedicated support',
        ],

        cta: 'Start Studio',
      },
    ],

    ctaTitle: 'Make your product',
    ctaAccent: 'look incredible.',

    ctaSub:
      'Open ScreenForge in your browser and turn static interfaces into cinematic product visuals.',

    footerCopy:
      '© 2025 ScreenForge. All rights reserved.',
  },
} as const;

type Lang = keyof typeof COPY;

/* ── Mini animated mockup preview ─────────────────────────── */
function HeroDeviceMock({ dim = false }: { dim?: boolean }) {
  return (
    <div
      style={{
        width: 200,
        height: 380,
        borderRadius: 32,
        background: '#0a0a0f',
        border: '2px solid rgba(255,255,255,0.12)',
        boxShadow: dim
          ? '0 20px 60px rgba(0,0,0,0.6)'
          : '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Notch */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        width: 90, height: 26, background: '#050507',
        borderRadius: 14, zIndex: 2,
        border: '1px solid rgba(255,255,255,0.06)',
      }} />
      {/* Screen gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, #1a0a3d 0%, #0a1628 40%, #04111e 100%)',
      }} />
      {/* Fake UI */}
      {!dim && (
        <div style={{ position: 'absolute', inset: 0, padding: '52px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 10, width: '55%', background: 'rgba(167,139,250,0.5)', borderRadius: 6 }} />
          <div style={{ height: 6, width: '80%', background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
          <div style={{ height: 6, width: '65%', background: 'rgba(255,255,255,0.07)', borderRadius: 4 }} />
          <div style={{ marginTop: 8, height: 80, background: 'rgba(124,58,237,0.12)', borderRadius: 12, border: '1px solid rgba(124,58,237,0.2)' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1, height: 56, background: 'rgba(14,165,233,0.1)', borderRadius: 8, border: '1px solid rgba(14,165,233,0.15)' }} />
            <div style={{ flex: 1, height: 56, background: 'rgba(16,185,129,0.1)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.15)' }} />
          </div>
          <div style={{ height: 6, width: '90%', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
          <div style={{ height: 6, width: '70%', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />
          <div style={{ marginTop: 4, height: 36, background: 'rgba(124,58,237,0.2)', borderRadius: 8, border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ height: 6, width: 60, background: 'rgba(255,255,255,0.5)', borderRadius: 3 }} />
          </div>
        </div>
      )}
      {!dim && (
        <div style={{
          position: 'absolute', top: '30%', left: '20%',
          width: 80, height: 80,
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.25), transparent)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

/* ── Tool cards data ───────────────────────────────────────── */
const TOOL_META = [
  {
    href: '/mockup-studio',
    icon: Monitor,
    iconBg: 'rgba(124,58,237,0.12)',
    iconBorder: 'rgba(124,58,237,0.25)',
    iconColor: '#a78bfa',
    previewBg: 'linear-gradient(135deg, #0f0c29, #1a0a3d)',
    image: '/mockup-studio.png',
  },
  {
    href: '/device-animation',
    icon: Clapperboard,
    iconBg: 'rgba(14,165,233,0.12)',
    iconBorder: 'rgba(14,165,233,0.25)',
    iconColor: '#38bdf8',
    previewBg: 'linear-gradient(135deg, #020f1c, #0a1628)',
    image: '/device-animation.png',
  },
];

/* ── Features icons ────────────────────────────────────────── */
const FEATURE_ICONS = [Zap, Layers, Film, Move, Sparkles, Download];

/* ── Main Component ────────────────────────────────────────── */
export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('es');
  const t = COPY[lang];
  const heroRef = useRef<HTMLDivElement>(null);

  /* Subtle mouse parallax on hero devices */
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const { innerWidth: w, innerHeight: h } = window;
      const dx = (e.clientX / w - 0.5) * 12;
      const dy = (e.clientY / h - 0.5) * 8;
      el.style.transform = `rotateY(${dx}deg) rotateX(${-dy}deg)`;
    };
    const reset = () => { el.style.transform = 'rotateY(0deg) rotateX(0deg)'; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseleave', reset);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseleave', reset);
    };
  }, []);

  return (
    <div className={s.page}>
      <div className="grain-overlay" aria-hidden="true" />

      {/* ── NAV ── */}
      <nav className={s.nav} aria-label="Main navigation">
        <div className={s.navLogo}>
          <div className={s.navLogoIcon}><Zap size={12} color="#fff" /></div>
          ScreenForge
        </div>

        <ul className={s.navLinks}>
          <li><a href="#tools" className={s.navLink}>{t.nav.tools}</a></li>
          <li><a href="#workflow" className={s.navLink}>{t.nav.workflow}</a></li>
          <li><a href="#pricing" className={s.navLink}>{t.nav.pricing}</a></li>
        </ul>

        <div className={s.navCta}>
          {/* Language toggle */}
          <div className={s.langToggle} role="group" aria-label="Language">
            <button
              className={`${s.langBtn} ${lang === 'es' ? s.langBtnActive : ''}`}
              onClick={() => setLang('es')}
            >ES</button>
            <button
              className={`${s.langBtn} ${lang === 'en' ? s.langBtnActive : ''}`}
              onClick={() => setLang('en')}
            >EN</button>
          </div>
          <button className={s.navBtnSecondary}>{t.nav.signin}</button>
          <Link to="/mockup-studio" className={s.navBtnPrimary}>{t.nav.launch}</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={s.hero} aria-labelledby="hero-heading">
        <div className={s.heroBg} aria-hidden="true" />
        <div className={s.heroGrid} aria-hidden="true" />

        <div className={s.heroContent}>
          <div className={s.heroBadge} aria-hidden="true">
            <span className={s.heroBadgeDot} />
            {t.badge}
          </div>

          <h1 className={s.heroTitle} id="hero-heading">
            {t.heroTitle}{' '}
            <span className={s.heroTitleAccent}>{t.heroAccent}</span>
          </h1>

          <p className={s.heroSubtitle}>{t.heroSub}</p>

          <div className={s.heroActions}>
            <Link to="/mockup-studio" className={s.btnPrimary} id="hero-cta-primary">
              <Monitor size={15} />{t.cta1}
            </Link>
            <Link to="/device-animation" className={s.btnSecondary} id="hero-cta-secondary">
              <Film size={15} />{t.cta2}
            </Link>
          </div>

          <div className={s.heroMeta}>
            {t.meta.map((item, i) => (
              <>
                {i > 0 && <span key={`sep-${i}`} className={s.heroMetaDivider} />}
                <span key={item}>{item}</span>
              </>
            ))}
          </div>
        </div>

        {/* Hero device composition */}
        <div
          className={s.heroDeviceStage}
          ref={heroRef}
          style={{ perspective: '1000px', transformStyle: 'preserve-3d', transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)' }}
          aria-hidden="true"
        >
          <div className={s.heroDeviceWrapper}>
            <div className={s.heroDeviceGlow} />
            <HeroDeviceMock />
            <div className={s.heroDeviceReflection}><HeroDeviceMock /></div>
          </div>
          <div className={s.heroDeviceWrapper2}><HeroDeviceMock dim /></div>
        </div>

        <div className={s.scrollIndicator} aria-hidden="true">
          <div className={s.scrollBar} />
          <span>Scroll</span>
        </div>
      </section>

      {/* ── TOOLS ── */}
      <section className={s.section} id="tools" aria-labelledby="tools-heading">
        <div className={s.sectionLabel}><Sparkles size={11} /> {t.toolsLabel}</div>
        <h2 className={s.sectionTitle} id="tools-heading">
          {t.toolsTitle.split('\n').map((line, i) => (
            <span key={i}>{line}{i === 0 && <br />}</span>
          ))}
        </h2>
        <p className={s.sectionSubtitle}>{t.toolsSub}</p>

        <div className={s.toolGrid}>
          {t.tools.map((tool, i) => {
            const meta = TOOL_META[i];
            const Icon = meta.icon;
            return (
              <Link
                key={tool.title}
                to={meta.href}
                className={s.toolCard}
              >
                <div
                  className={s.toolCardIcon}
                  style={{ background: meta.iconBg, borderColor: meta.iconBorder, color: meta.iconColor }}
                >
                  <Icon size={18} />
                </div>
                <div className={s.toolCardTitle}>{tool.title}</div>
                <p className={s.toolCardDesc}>{tool.desc}</p>
                <div className={s.toolCardTags}>
                  {tool.tags.map(tag => <span key={tag} className={s.toolCardTag}>{tag}</span>)}
                </div>
                <div className={s.toolCardPreview} style={{ background: meta.previewBg }} aria-hidden="true">
                  <div className={s.toolCardPreviewGrid} />
                  {meta.image ? (
                    <img src={meta.image} alt={tool.title} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain', opacity: 0.85 }} />
                  ) : (
                    <Icon size={28} color="rgba(255,255,255,0.06)" />
                  )}
                </div>
                <ArrowUpRight size={16} className={s.toolCardArrow} aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── FEATURES STRIP ── */}
      <div className={s.featuresStrip} aria-label="Platform features">
        <div className={s.featuresStripBg} aria-hidden="true" />
        <div className={s.featuresStripInner}>
          {t.features.map((f, i) => {
            const FIcon = FEATURE_ICONS[i];
            return (
              <div key={f.title} className={s.featureItem}>
                <div className={s.featureItemIcon}><FIcon size={16} /></div>
                <div className={s.featureItemTitle}>{f.title}</div>
                <div className={s.featureItemDesc}>{f.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── WORKFLOW ── */}
      <section className={s.workflowSection} id="workflow" aria-labelledby="workflow-heading">
        <div className={s.workflowBg} aria-hidden="true" />
        <div className={s.sectionLabel}><Film size={11} /> {t.workflowLabel}</div>
        <h2 className={s.sectionTitle} id="workflow-heading">
          {t.workflowTitle.split('\n').map((line, i) => (
            <span key={i}>{line}{i === 0 && <br />}</span>
          ))}
        </h2>
        <p className={s.sectionSubtitle}>{t.workflowSub}</p>
        <div className={s.workflowSteps}>
          {t.steps.map(step => (
            <div key={step.num} className={s.workflowStep}>
              <div className={s.workflowStepNum}>{step.num}</div>
              <div className={s.workflowStepContent}>
                <div className={s.workflowStepTitle}>{step.title}</div>
                <div className={s.workflowStepDesc}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className={s.pricingSection} id="pricing" aria-labelledby="pricing-heading">
        <div className={s.pricingBg} aria-hidden="true" />
        <div className={s.pricingInner}>
          <div className={s.pricingHeader}>
            <div className={s.sectionLabel} style={{ justifyContent: 'center' }}><Zap size={11} /> {t.pricingLabel}</div>
            <h2 className={s.sectionTitle} id="pricing-heading" style={{ textAlign: 'center' }}>
              {t.pricingTitle}
            </h2>
            <p className={s.sectionSubtitle} style={{ textAlign: 'center', margin: '0 auto' }}>
              {t.pricingSub}
            </p>
          </div>
          <div className={s.pricingGrid}>
            {t.pricing.map(plan => (
              <div
                key={plan.tier}
                className={`${s.pricingCard} ${plan.featured ? s.pricingCardFeatured : ''}`}
              >
                {plan.featured && <div className={s.pricingCardFeaturedBadge}>{lang === 'es' ? 'Más popular' : 'Most Popular'}</div>}
                <div className={s.pricingCardTier}>{plan.tier}</div>
                <div className={s.pricingCardPrice}>
                  <span className={s.pricingCardPriceAmount}>{plan.price}</span>
                  <span className={s.pricingCardPricePeriod}>{plan.period}</span>
                </div>
                <p className={s.pricingCardDesc}>{plan.desc}</p>
                <ul className={s.pricingCardFeatures} aria-label={`${plan.tier} plan features`}>
                  {plan.features.map(f => (
                    <li key={f} className={s.pricingCardFeature}>
                      <Check size={13} className={s.pricingCardFeatureIcon} aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`${s.pricingCardCta} ${plan.featured ? s.pricingCardCtaPrimary : s.pricingCardCtaDefault}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className={s.ctaBanner} aria-labelledby="cta-heading">
        <div className={s.ctaBannerBg} aria-hidden="true" />
        <h2 className={s.ctaBannerTitle} id="cta-heading">
          {t.ctaTitle}<br />
          <span className={s.heroTitleAccent}>{t.ctaAccent}</span>
        </h2>
        <p className={s.ctaBannerSub}>{t.ctaSub}</p>
        <div className={s.ctaBannerActions}>
          <Link to="/mockup-studio" className={s.btnPrimary} id="cta-banner-primary">
            <Monitor size={15} />{t.cta1}
          </Link>
          <Link to="/device-animation" className={s.btnSecondary} id="cta-banner-secondary">
            <Clapperboard size={15} />{t.cta2}
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.footerLogo}>ScreenForge</div>
          <ul className={s.footerLinks}>
            <li><a href="#tools" className={s.footerLink}>{t.nav.tools}</a></li>
            <li><a href="#workflow" className={s.footerLink}>{t.nav.workflow}</a></li>
            <li><a href="#pricing" className={s.footerLink}>{t.nav.pricing}</a></li>
          </ul>
          <div className={s.footerCopy}>{t.footerCopy}</div>
        </div>
      </footer>
    </div>
  );
}