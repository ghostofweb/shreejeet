import type { IconName } from '@/components/Icon';
import type { StarType } from './types';

export interface StarMeta {
  label: string;
  icon: IconName;
  /** Core colour of the star, and the glow it throws. */
  color: string;
}

/** Each kind of star burns a different colour, so the sky has variety. */
export const STAR_TYPES: Record<StarType, StarMeta> = {
  memory: { label: 'Memory', icon: 'star', color: '#ffe9b8' },
  date: { label: 'A date', icon: 'moon', color: '#bcd0ff' },
  love: { label: 'Something I love', icon: 'heart', color: '#ff9db4' },
  moment: { label: 'A moment', icon: 'sparkle', color: '#ffc98a' },
  secret: { label: 'A secret', icon: 'gift', color: '#d7b0ff' },
  photo: { label: 'A photo', icon: 'camera', color: '#a8e6d8' },
  funny: { label: 'Something funny', icon: 'smile', color: '#ffd98a' },
  letter: { label: 'A letter', icon: 'envelope', color: '#ffb9a3' },
  place: { label: 'A place', icon: 'pin', color: '#9fd6ff' },
  note: { label: 'A note', icon: 'note', color: '#e4e0d4' },
};

export const starMeta = (t?: StarType | null): StarMeta =>
  STAR_TYPES[t ?? 'memory'] ?? STAR_TYPES.memory;
