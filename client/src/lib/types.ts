export type Author = 'me' | 'her' | 'both';
export type Role = 'me' | 'her';

export type SceneType =
  | 'sunrise'
  | 'blossom'
  | 'sky'
  | 'night'
  | 'rain'
  | 'snow'
  | 'city'
  | 'beach'
  | 'glow'
  | 'cozy';

export type StarType =
  | 'memory'
  | 'date'
  | 'love'
  | 'moment'
  | 'secret'
  | 'photo'
  | 'funny'
  | 'letter'
  | 'place'
  | 'note';

export type ReasonCategory =
  | 'love'
  | 'funny'
  | 'cute'
  | 'attractive'
  | 'appreciate'
  | 'proud'
  | 'thought';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  avatarUrl?: string;
}

export interface MediaRef {
  mediaId?: string;
  url: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  alt?: string;
}

export interface MediaAsset extends MediaRef {
  id: string;
  provider: 'cloudinary' | 'local';
  bytes?: number;
  createdAt: string;
}

interface Base {
  id: string;
  createdBy: Author;
  createdAt: string;
  updatedAt: string;
}

export interface StoryEvent extends Base {
  date: string;
  endDate?: string | null;
  title: string;
  description: string;
  location?: string;
  sceneType: SceneType;
  photos: MediaRef[];
  video?: MediaRef | null;
  specialMessage?: string;
  order: number;
}

export interface Reason extends Base {
  text: string;
  category: ReasonCategory;
  about: Role;
  timesShown: number;
}

export interface UniverseStar extends Base {
  type: StarType;
  title: string;
  message?: string;
  photos: MediaRef[];
  date?: string | null;
  position: { x: number; y: number; z: number };
  colorSeed: number;
  groupKey?: string;
  visibility: 'visible' | 'hidden' | 'unlock_at';
  unlockAt?: string | null;
  isSecret: boolean;
  locked?: boolean;
}

export interface OpenWhenLetter extends Base {
  situation: string;
  body: string;
  photos: MediaRef[];
  audio?: MediaRef | null;
  unlockRule: 'always' | 'after_date' | 'once';
  unlockAt?: string | null;
  openedBy: { role: Role; at: string }[];
  sealColor: string;
  locked?: boolean;
  openedByMe?: boolean;
  firstOpen?: boolean;
}

export interface Confession extends Base {
  prompt: string;
  text: string;
  photo?: MediaRef | null;
  date?: string | null;
  lockRule: 'none' | 'after_date' | 'hold';
  unlockAt?: string | null;
  revealedBy: { role: Role; at: string }[];
  locked?: boolean;
  revealedByMe?: boolean;
}

export interface ImportantDate extends Base {
  title: string;
  date: string;
  description?: string;
  location?: string;
  message?: string;
  photo?: MediaRef | null;
  recurrence: 'none' | 'yearly';
  isAnchor: boolean;
  emoji: string;
}

export interface AdminStats {
  memories: number;
  stars: number;
  reasons: number;
  letters: number;
  confessions: number;
  dates: number;
  media: number;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}
