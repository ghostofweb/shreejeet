import type { SceneType } from './types';

export type ParticleKind =
  | 'dust'
  | 'petal'
  | 'cloud'
  | 'star'
  | 'rain'
  | 'snow'
  | 'bokeh'
  | 'shimmer'
  | 'ember'
  | 'none';

export interface Scene {
  /** Layered CSS background. Painted on a fixed element behind everything. */
  background: string;
  /** Text colour while this scene is on top. */
  fg: string;
  /** Accent for the spine, dates and highlights. */
  accent: string;
  particle: ParticleKind;
  /** How many particles at desktop width. Mobile uses roughly half. */
  density: number;
  /** A soft light bloom sitting above the gradient. */
  glow?: string;
  label: string;
}

/**
 * Ten worlds. The admin picks one per memory and the whole page changes
 * temperature as she scrolls into it.
 */
export const SCENES: Record<SceneType, Scene> = {
  sunrise: {
    label: 'Sunrise',
    background:
      'linear-gradient(180deg, #2a1a2e 0%, #6b3a52 22%, #c2685f 48%, #e8a06b 70%, #f5d5a8 100%)',
    glow: 'radial-gradient(60% 40% at 50% 88%, rgba(255,214,150,0.55), transparent 70%)',
    fg: '#fff4e6',
    accent: '#ffc887',
    particle: 'dust',
    density: 26,
  },
  blossom: {
    label: 'Blossom',
    background:
      'linear-gradient(180deg, #3a2233 0%, #7d4560 30%, #c98099 62%, #f3cdd6 100%)',
    glow: 'radial-gradient(55% 45% at 30% 25%, rgba(255,200,220,0.35), transparent 70%)',
    fg: '#fff0f4',
    accent: '#ffb3c8',
    particle: 'petal',
    density: 22,
  },
  sky: {
    label: 'Sky',
    background:
      'linear-gradient(180deg, #1d3a5c 0%, #3f6f9e 35%, #7aa9cf 68%, #cfe3f0 100%)',
    glow: 'radial-gradient(50% 40% at 70% 20%, rgba(255,255,255,0.30), transparent 70%)',
    fg: '#f2f8ff',
    accent: '#a8d4f5',
    particle: 'cloud',
    density: 7,
  },
  night: {
    label: 'Night',
    background:
      'linear-gradient(180deg, #06060f 0%, #0f1128 40%, #1b1f43 72%, #2b2a56 100%)',
    glow: 'radial-gradient(40% 30% at 78% 16%, rgba(200,215,255,0.28), transparent 70%)',
    fg: '#e8eaff',
    accent: '#b9c2ff',
    particle: 'star',
    density: 60,
  },
  rain: {
    label: 'Rain',
    background:
      'linear-gradient(180deg, #10131a 0%, #1e2430 42%, #333c4a 75%, #4a5462 100%)',
    glow: 'radial-gradient(70% 50% at 50% 100%, rgba(140,170,200,0.16), transparent 70%)',
    fg: '#dfe6ee',
    accent: '#8fb3cc',
    particle: 'rain',
    density: 46,
  },
  snow: {
    label: 'Snow',
    background:
      'linear-gradient(180deg, #1a2130 0%, #35435c 38%, #6f8299 72%, #c3d0dd 100%)',
    glow: 'radial-gradient(60% 45% at 50% 12%, rgba(255,255,255,0.22), transparent 70%)',
    fg: '#f3f7fb',
    accent: '#cfe0ee',
    particle: 'snow',
    density: 34,
  },
  city: {
    label: 'City',
    background:
      'linear-gradient(180deg, #14101f 0%, #2e1f3d 34%, #5c3450 64%, #9c5b52 100%)',
    glow: 'radial-gradient(70% 40% at 50% 96%, rgba(255,170,110,0.34), transparent 70%)',
    fg: '#fbeadf',
    accent: '#ffb27a',
    particle: 'bokeh',
    density: 20,
  },
  beach: {
    label: 'Beach',
    background:
      'linear-gradient(180deg, #123a4d 0%, #2c7c94 34%, #7cc4c4 64%, #f0dfba 100%)',
    glow: 'radial-gradient(45% 35% at 62% 18%, rgba(255,246,200,0.42), transparent 70%)',
    fg: '#f4fbfa',
    accent: '#ffe6a3',
    particle: 'shimmer',
    density: 24,
  },
  glow: {
    label: 'Glow',
    background:
      'linear-gradient(180deg, #1d1020 0%, #4a1f34 32%, #8f3f48 62%, #d98a5a 100%)',
    glow: 'radial-gradient(55% 45% at 50% 60%, rgba(255,200,130,0.45), transparent 70%)',
    fg: '#fff2e4',
    accent: '#ffd08a',
    particle: 'ember',
    density: 28,
  },
  cozy: {
    label: 'Cozy',
    background:
      'linear-gradient(180deg, #1c1410 0%, #3a2a1e 36%, #6b4a30 68%, #a67a4a 100%)',
    glow: 'radial-gradient(50% 40% at 26% 72%, rgba(255,186,110,0.38), transparent 70%)',
    fg: '#faeedd',
    accent: '#e8b06a',
    particle: 'dust',
    density: 24,
  },
};

export const sceneFor = (type?: SceneType | null): Scene => SCENES[type ?? 'sunrise'] ?? SCENES.sunrise;
