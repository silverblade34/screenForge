export type DeviceModel = "iphone-16-pro" | "iphone-16" | "macbook-pro" | "browser" | "none";

/** How a scene behaves:
 *  animation – classic camera + entrance animation mode
 *  video – replaces camera animation with a simple video player inside the device
 *  scroll – scrolls a long image inside the device (like a website capture)
 */
export type SceneMode = "animation" | "video" | "scroll";

export interface SceneScene {
  id: string;
  name: string;
  duration: number; // in seconds
  mode: SceneMode;
  
  // -- Mode: Animation --
  animationPreset: AnimationPreset;
  easing: EasingType;
  camera: CameraState;
  color: string; // timeline block color
  
  // -- Mode: Video / Scroll --
  video?: string; // Data URL or object URL of the video
  image?: string; // Data URL or object URL of static image
  videoDuration?: number;
  videoTrimStart?: number;
  videoTrimEnd?: number;
  videoPlaybackRate?: number;
  scrollSpeed?: number;
  
  // -- Interactive --
  hotspots?: FlowHotspot[];
}

export interface FlowHotspot {
  id: string;
  x: number;     // 0-100% of device screen
  y: number;     // 0-100% of device screen
  label: string; // e.g. "Tap Here"
  action: "next-scene" | "link" | "none";
  target?: string;
}

export type AnimationPreset = "none" | "floating-drift" | "cinematic-push" | "focus-pull" | "hero-reveal" | "ambient-motion" | "depth-parallax" | "camera-slide" | "precision-zoom";

export type EasingType = "ease-in-out" | "ease-out" | "linear" | "spring";

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  color: string; // identifier color in UI
  locked: boolean;
}

export interface CameraState {
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
  blur: number;
  tiltX: number;
  tiltY: number;
}

export type FrameColor = "black" | "lavender" | "mist-blue" | "sage" | "white";

export const FRAME_COLORS: { value: FrameColor; label: string; preview: string }[] = [
  { value: "black",     label: "Black",     preview: "/frames/preview/black.png" },
  { value: "lavender",  label: "Lavender",  preview: "/frames/preview/lavender.png" },
  { value: "sage",      label: "Sage",      preview: "/frames/preview/sage.png" },
  { value: "mist-blue", label: "Mist Blue", preview: "/frames/preview/mist-blue.png" },
  { value: "white",     label: "White",     preview: "/frames/preview/white.png" },
];

export interface BackgroundOption {
  id: string;
  label: string;
  type: "solid" | "linear" | "radial";
  style: any; // Used for CSS rendering in UI
  konvaFill?: string; // Solid hex color
  konvaGradient?: {
    type: "linear" | "radial";
    colorStops: (number | string)[];
    // linear coords:
    x1?: number; y1?: number; x2?: number; y2?: number;
    // radial coords:
    cx?: number; cy?: number; radius?: number;
  };
}

export const BACKGROUNDS: BackgroundOption[] = [
  { id: 'transparent', label: 'Transparent', type: 'solid', style: { background: 'transparent' }, konvaFill: 'transparent' },
  { id: 'studio-dark', label: 'Studio Dark', type: 'solid', style: { background: 'radial-gradient(ellipse at top, #334155 0%, #0f172a 80%)' } },
  { id: 'studio-light', label: 'Studio Light', type: 'solid', style: { background: 'radial-gradient(ellipse at top, #f8fafc 0%, #e2e8f0 80%)' } },
  { id: 'neon-purple', label: 'Neon Purple', type: 'solid', style: { background: 'radial-gradient(ellipse at top, #9333ea 0%, #1e1b4b 80%)' } },
  { id: 'ocean-glow', label: 'Ocean Glow', type: 'solid', style: { background: 'radial-gradient(ellipse at top, #0ea5e9 0%, #082f49 80%)' } },
  { id: 'sunset-glow', label: 'Sunset Glow', type: 'solid', style: { background: 'radial-gradient(ellipse at top, #f43f5e 0%, #4c0519 80%)' } },
  { id: 'emerald-spot', label: 'Emerald Spot', type: 'solid', style: { background: 'radial-gradient(ellipse at top, #10b981 0%, #064e3b 80%)' } },
  { id: 'midnight',  label: 'Midnight',  type: 'solid', style: { background: 'linear-gradient(180deg, #1e293b 0%, #020617 100%)' } },
  { id: 'warm-spot', label: 'Warm Spot', type: 'solid', style: { background: 'radial-gradient(ellipse at top, #fbbf24 0%, #451a03 80%)' } },
  { id: 'cosmic',    label: 'Cosmic',    type: 'solid', style: { background: 'radial-gradient(ellipse at top center, #3b0764 0%, #000000 80%)' } },
  { id: 'aurora',    label: 'Aurora',    type: 'solid', style: { background: 'radial-gradient(ellipse at top, #34d399 0%, #1e1b4b 100%)' } },
  { id: 'slate',     label: 'Slate',     type: 'solid', style: { background: 'radial-gradient(ellipse at top, #64748b 0%, #0f172a 80%)' } },
];

export const DEFAULT_CAMERA: CameraState = {
  zoom: 0.9,
  panX: 0,
  panY: 0,
  rotation: 0,
  blur: 0,
  tiltX: 0,
  tiltY: 0,
};

export const SCENE_PRESETS = [
  { label: 'App Showcase', animation: 'floating-drift' as AnimationPreset, easing: 'ease-in-out' as EasingType, desc: 'Floating drift loop' },
  { label: 'Hero Launch', animation: 'hero-reveal' as AnimationPreset, easing: 'ease-out' as EasingType, desc: 'Fade + scale entrance' },
  { label: 'Feature Focus', animation: 'focus-pull' as AnimationPreset, easing: 'ease-in-out' as EasingType, desc: 'Rack-focus lens pull' },
  { label: 'Dashboard Demo', animation: 'camera-slide' as AnimationPreset, easing: 'ease-in-out' as EasingType, desc: 'Camera slide + stable device' },
  { label: 'Detail Zoom', animation: 'precision-zoom' as AnimationPreset, easing: 'ease-out' as EasingType, desc: 'Precision zoom for showcases' },
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

export const DEFAULT_SCENES: SceneScene[] = [
  { id: "s1", name: "Intro", duration: 3.5, mode: "animation", animationPreset: "hero-reveal", easing: "ease-out", camera: { ...DEFAULT_CAMERA }, color: "#7c3aed" },
  { id: "s2", name: "Feature", duration: 4, mode: "animation", animationPreset: "floating-drift", easing: "ease-in-out", camera: { ...DEFAULT_CAMERA, zoom: 1.08, panY: -20 }, color: "#0ea5e9" },
  { id: "s3", name: "Reveal", duration: 3, mode: "animation", animationPreset: "precision-zoom", easing: "ease-out", camera: { ...DEFAULT_CAMERA, zoom: 1.15 }, color: "#10b981" },
];

export const DEFAULT_LAYERS: Layer[] = [
  { id: "device",     name: "Device",     visible: true, opacity: 100, color: "#7c3aed", locked: false },
  { id: "glow",       name: "Glow",       visible: true, opacity: 80,  color: "#a855f7", locked: false },
  { id: "shadow",     name: "Shadow",     visible: true, opacity: 60,  color: "#6366f1", locked: false },
  { id: "background", name: "Background", visible: true, opacity: 100, color: "#0ea5e9", locked: true  },
];

export interface TextLayer {
  id: string;
  type: "title" | "subtitle" | "caption" | "badge";
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
  align: "left" | "center" | "right";
  
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
  animationIn?: "none" | "fade" | "typewriter" | "bounce" | "slide-up";
}

export type MediaAsset = {
  id: string;
  type: "image" | "video";
  url: string;
  name: string;
};

export const FONT_PRESETS = [
  { id: "modern", label: "Modern", font: "Inter, sans-serif", preview: "Aa" },
  { id: "serif", label: "Editorial", font: "Playfair Display, serif", preview: "Aa" },
  { id: "mono", label: "Code", font: "JetBrains Mono, monospace", preview: "Aa" },
  { id: "display", label: "Impact", font: "Oswald, sans-serif", preview: "Aa" },
];

export const TEXT_BLOCKS: Partial<TextLayer>[] = [
  { type: "title", text: "Big Title", fontSize: 72, fontWeight: 800, color: "#ffffff", opacity: 100, glow: 0, animationIn: "slide-up" },
  { type: "subtitle", text: "Subtitle Text", fontSize: 32, fontWeight: 500, color: "#a1a1aa", opacity: 100, glow: 0, animationIn: "fade" },
  { type: "caption", text: "Small caption here", fontSize: 16, fontWeight: 400, color: "#71717a", opacity: 100, glow: 0, animationIn: "none" },
];
