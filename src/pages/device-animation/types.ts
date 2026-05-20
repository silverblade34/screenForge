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
  | 'cinematic-reveal'
  | 'floating'
  | 'orbit'
  | 'dolly-zoom'
  | 'camera-pan'
  | 'parallax'
  | 'perspective-reveal'
  | 'focus-blur'
  | 'bounce'
  | 'startup-launch';

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
  label: string;
  targetSceneId: string;
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
  { value: 'none',               label: 'No Animation',       icon: 'slash',      desc: 'Static device, pure camera movement' },
  { value: 'cinematic-reveal',   label: 'Cinematic Reveal',   icon: 'film',       desc: 'Dramatic entrance from below' },
  { value: 'floating',           label: 'Float & Breathe',    icon: 'wind',       desc: 'Organic floating loop' },
  { value: 'orbit',              label: 'Orbit Rotation',     icon: 'rotate-cw',  desc: 'Slow 3D orbit spin' },
  { value: 'dolly-zoom',         label: 'Dolly Zoom',         icon: 'maximize-2', desc: 'Hitchcock perspective shift' },
  { value: 'camera-pan',         label: 'Camera Pan',         icon: 'move',       desc: 'Horizontal cinematic pan' },
  { value: 'parallax',           label: 'Parallax Drift',     icon: 'sparkles',   desc: 'Multi-layer depth drift' },
  { value: 'perspective-reveal', label: 'Perspective Reveal', icon: 'box',        desc: 'Unfold from flat to 3D' },
  { value: 'startup-launch',     label: 'Startup Launch',     icon: 'rocket',     desc: 'Glow + float entrance' },
  { value: 'focus-blur',         label: 'Focus Blur',         icon: 'eye',        desc: 'Rack focus cinema effect' },
  { value: 'bounce',             label: 'Soft Bounce',        icon: 'zap',        desc: 'Spring bounce entrance' },
];

const defScene = (
  id: string, name: string, duration: number,
  animation: AnimationPreset, easing: EasingType,
  camera: CameraState, color: string,
): SceneScene => ({
  id, name, duration, animation, easing, camera, color,
  cameraSpeed: 1, scrollSpeed: 6, mode: 'animation', hotspots: [],
});

export const DEFAULT_SCENES: SceneScene[] = [
  defScene('s1', 'Intro',   3, 'cinematic-reveal',   'spring',      { ...DEFAULT_CAMERA },                          '#7c3aed'),
  defScene('s2', 'Feature', 4, 'floating',           'ease-in-out', { ...DEFAULT_CAMERA, zoom: 1.1, panY: -30 },   '#0ea5e9'),
  defScene('s3', 'Reveal',  3, 'perspective-reveal', 'ease-out',    { ...DEFAULT_CAMERA, tiltX: 10, zoom: 0.9 },   '#10b981'),
];

export const DEFAULT_LAYERS: Layer[] = [
  { id: 'device',     name: 'Device',     visible: true, opacity: 100, color: '#7c3aed', locked: false },
  { id: 'glow',       name: 'Glow',       visible: true, opacity: 80,  color: '#a855f7', locked: false },
  { id: 'shadow',     name: 'Shadow',     visible: true, opacity: 60,  color: '#6366f1', locked: false },
  { id: 'background', name: 'Background', visible: true, opacity: 100, color: '#0ea5e9', locked: true  },
];
