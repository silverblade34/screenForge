export type DeviceModel = 'iphone-16-pro' | 'iphone-16' | 'macbook-pro' | 'browser' | 'none';
export type FrameColor = 'spaceBlack' | 'spaceGray' | 'silver' | 'midnight' | 'gold' | 'naturalTitanium' | 'titaniumBlue' | 'starlight';

/** How a scene behaves:
 *  animation – classic camera + entrance animation mode
 *  scroll    – long vertical screenshot that scrolls inside the device
 *  flow      – interactive prototype: each scene is a screen, hotspots link screens
 */
export type SceneMode = 'animation' | 'scroll' | 'flow';

export type AnimationPreset =
  | 'none'
  | 'floating-drift'
  | 'cinematic-push'
  | 'focus-pull'
  | 'hero-reveal'
  | 'ambient-motion'
  | 'depth-parallax'
  | 'camera-slide'
  | 'precision-zoom';

export type EasingType = 'spring' | 'ease-out' | 'ease-in-out' | 'linear' | 'anticipate' | 'bounce';

export interface CameraState {
  zoom: number;       // 0.3 – 3.0
  panX: number;       // -500 – 500 px
  panY: number;       // -500 – 500 px
  rotation: number;  // -45 – 45 deg
  blur: number;       // 0 – 20 px
  tiltX: number;     // -30 – 30 deg
  tiltY: number;     // -30 – 30 deg
}

/** A tap hotspot on a flow screen */
export interface FlowHotspot {
  id: string;
  x: number;          // % from left of screen (0–100)
  y: number;          // % from top  of screen (0–100)
  width: number;
  height: number;
  label: string;
  shape: 'circle' | 'pill' | 'invisible';
  targetSceneId: string;
  animationPreset: 'pulse' | 'glow' | 'float' | 'fade' | 'ripple' | 'none';
  opacity: number;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  color: string;
  locked: boolean;
}

export interface SceneScene {
  id: string;
  name: string;
  duration: number;       // seconds
  animation: AnimationPreset;
  easing: EasingType;
  camera: CameraState;
  color: string;          // timeline colour
  cameraSpeed: number;    // 0.1 – 3.0  (camera transition multiplier)
  /** Only used in 'scroll' mode — seconds for one full scroll pass */
  scrollSpeed: number;
  /** Scene display mode */
  mode: SceneMode;
  /** Hotspots for flow mode */
  hotspots: FlowHotspot[];
  /** Scene specific image */
  image?: string | null;
}

export interface BackgroundOption {
  id: string;
  label: string;
  style: React.CSSProperties;
}

export const DEFAULT_CAMERA: CameraState = {
  zoom: 1,
  panX: 0,
  panY: 0,
  rotation: 0,
  blur: 0,
  tiltX: 0,
  tiltY: 0,
};

export const FRAME_COLORS: { value: FrameColor; label: string; color: string }[] = [
  { value: 'spaceBlack',      label: 'Space Black',      color: '#151516' },
  { value: 'spaceGray',       label: 'Space Gray',       color: '#53565a' },
  { value: 'silver',          label: 'Silver',           color: '#e5e7eb' },
  { value: 'midnight',        label: 'Midnight',         color: '#1e293b' },
  { value: 'gold',            label: 'Gold',             color: '#e5c199' },
  { value: 'naturalTitanium', label: 'Natural Titanium', color: '#a8a297' },
  { value: 'titaniumBlue',    label: 'Titanium Blue',    color: '#374754' },
  { value: 'starlight',       label: 'Starlight',        color: '#e2dcd0' },
];

export const BACKGROUNDS: BackgroundOption[] = [
  { id: 'void',      label: 'Void',      style: { background: '#000000' } },
  { id: 'cosmic',    label: 'Cosmic',    style: { background: 'radial-gradient(ellipse at center, #1a0533 0%, #050505 70%)' } },
  { id: 'aurora',    label: 'Aurora',    style: { background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' } },
  { id: 'ocean',     label: 'Ocean',     style: { background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' } },
  { id: 'ember',     label: 'Ember',     style: { background: 'linear-gradient(135deg, #1a0000, #3d0000, #1a0000)' } },
  { id: 'mint',      label: 'Mint',      style: { background: 'linear-gradient(135deg, #004d40, #00695c, #004d40)' } },
  { id: 'slate',     label: 'Slate',     style: { background: 'linear-gradient(135deg, #0f172a, #1e293b)' } },
  { id: 'purple',    label: 'Purple',    style: { background: 'radial-gradient(ellipse at top, #2e1065 0%, #09090b 60%)' } },
];

export const ANIMATION_PRESETS: { value: AnimationPreset; label: string; icon: string; desc: string }[] = [
  { value: 'none',            label: 'Static',           icon: 'slash',      desc: 'No motion — pure camera control' },
  { value: 'floating-drift',  label: 'Floating Drift',   icon: 'wind',       desc: 'Ultra-subtle levitation loop' },
  { value: 'cinematic-push',  label: 'Cinematic Push',   icon: 'move',       desc: 'Slow camera push-in with micro parallax' },
  { value: 'focus-pull',      label: 'Focus Pull',       icon: 'eye',        desc: 'Lens rack-focus cinematic feel' },
  { value: 'hero-reveal',     label: 'Hero Reveal',      icon: 'film',       desc: 'Fade + drift + scale entrance' },
  { value: 'ambient-motion',  label: 'Ambient Motion',   icon: 'sparkles',   desc: 'Continuous idle loop for demos' },
  { value: 'depth-parallax',  label: 'Depth Parallax',   icon: 'layers',     desc: 'Fake cinematic depth — no rotation' },
  { value: 'camera-slide',    label: 'Camera Slide',     icon: 'maximize-2', desc: 'Horizontal cinematic pan — stable device' },
  { value: 'precision-zoom',  label: 'Precision Zoom',   icon: 'zoom-in',    desc: 'Smooth zoom into UI for feature showcases' },
];

const defScene = (
  id: string, name: string, duration: number,
  animation: AnimationPreset, easing: EasingType,
  camera: CameraState, color: string,
): SceneScene => ({
  id, name, duration, animation, easing, camera, color,
  cameraSpeed: 1, scrollSpeed: 6, mode: 'animation', hotspots: [], image: null,
});

export const DEFAULT_SCENES: SceneScene[] = [
  defScene('s1', 'Intro',   3.5, 'hero-reveal',      'ease-out',    { ...DEFAULT_CAMERA },                        '#7c3aed'),
  defScene('s2', 'Feature', 4,   'floating-drift',   'ease-in-out', { ...DEFAULT_CAMERA, zoom: 1.08, panY: -20 },'#0ea5e9'),
  defScene('s3', 'Reveal',  3,   'precision-zoom',   'ease-out',    { ...DEFAULT_CAMERA, zoom: 1.15 },            '#10b981'),
];

export const DEFAULT_LAYERS: Layer[] = [
  { id: 'device',     name: 'Device',     visible: true, opacity: 100, color: '#7c3aed', locked: false },
  { id: 'glow',       name: 'Glow',       visible: true, opacity: 80,  color: '#a855f7', locked: false },
  { id: 'shadow',     name: 'Shadow',     visible: true, opacity: 60,  color: '#6366f1', locked: false },
  { id: 'background', name: 'Background', visible: true, opacity: 100, color: '#0ea5e9', locked: true  },
];

export interface TextLayer {
  id: string;
  type: 'title' | 'subtitle' | 'caption' | 'badge';
  text: string;

  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;

  fontFamily: string;
  fontPreset: string;

  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;

  color: string;
  opacity: number;
  align: 'left' | 'center' | 'right';

  glow: number;
  blur?: number;

  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;

  shadow?: boolean;
  locked?: boolean;
  hidden?: boolean;
  zIndex: number;

  startTime?: number;
  duration?: number;
  animationIn?: 'none' | 'fade' | 'typewriter' | 'bounce' | 'slide-up';
}

export const FONT_PRESETS = [
  { id: 'modern', label: 'Modern', font: 'Inter, sans-serif', preview: 'Aa' },
  { id: 'cinematic', label: 'Cinematic', font: '"Bebas Neue", sans-serif', preview: 'Aa' },
  { id: 'luxury', label: 'Luxury', font: '"Cormorant Garamond", serif', preview: 'Aa' },
  { id: 'apple', label: 'Apple', font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', preview: 'Aa' },
  { id: 'editorial', label: 'Editorial', font: '"General Sans", Georgia, serif', preview: 'Aa' },
  { id: 'mono', label: 'Mono', font: '"JetBrains Mono", ui-monospace, monospace', preview: 'Aa' },
];

export const TEXT_BLOCKS: { id: string; label: string; text: string; type: TextLayer['type']; fontSize: number; fontWeight: number; letterSpacing: number; lineHeight: number; color: string; gradient?: boolean }[] = [
  { id: 'hero', label: 'Hero Title', text: 'The Future of\nProduct Design', type: 'title', fontSize: 64, fontWeight: 800, letterSpacing: -2, lineHeight: 1.0, color: '#ffffff', gradient: false },
  { id: 'launch', label: 'Launch', text: 'Introducing ScreenForge 2.0', type: 'title', fontSize: 42, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.05, color: '#ffffff', gradient: true },
  { id: 'feature', label: 'Feature', text: 'Powerful timeline editor', type: 'subtitle', fontSize: 28, fontWeight: 600, letterSpacing: -0.5, lineHeight: 1.2, color: '#e4e4e7', gradient: false },
  { id: 'subtitle', label: 'Subtitle', text: 'Built for modern product teams', type: 'subtitle', fontSize: 22, fontWeight: 400, letterSpacing: 0, lineHeight: 1.4, color: '#a1a1aa', gradient: false },
  { id: 'cta', label: 'CTA', text: 'Start for free →', type: 'badge', fontSize: 14, fontWeight: 700, letterSpacing: 0.5, lineHeight: 1.4, color: '#c084fc', gradient: false },
  { id: 'caption', label: 'Caption', text: 'Available on iOS & Android', type: 'caption', fontSize: 13, fontWeight: 400, letterSpacing: 0.3, lineHeight: 1.6, color: '#71717a', gradient: false },
];
