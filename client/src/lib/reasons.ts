import type { IconName } from '@/components/Icon';
import type { ReasonCategory } from './types';

export interface CategoryMeta {
  label: string;
  icon: IconName;
  /** Ribbon colour on the card. */
  color: string;
  /** Petal colour of the tulip that blooms with it. */
  petal: string;
  petalDark: string;
}

/**
 * Each category has its own tulip. The colour carries the mood — nothing here
 * needs a label to be understood, but it gets one anyway.
 */
export const CATEGORIES: Record<ReasonCategory, CategoryMeta> = {
  love: {
    label: 'something I love',
    icon: 'heart',
    color: '#c9566b',
    petal: '#e0607f',
    petalDark: '#b03f5c',
  },
  funny: {
    label: 'something funny',
    icon: 'smile',
    color: '#d9932f',
    petal: '#f0b955',
    petalDark: '#c98a24',
  },
  cute: {
    label: 'something cute',
    icon: 'tulip-bud',
    color: '#e08aa6',
    petal: '#f4a9c0',
    petalDark: '#cf7391',
  },
  attractive: {
    label: 'something attractive',
    icon: 'flame',
    color: '#c0392b',
    petal: '#e35d4a',
    petalDark: '#a83426',
  },
  appreciate: {
    label: 'something I appreciate',
    icon: 'seedling',
    color: '#5f9e73',
    petal: '#7bbd8e',
    petalDark: '#4d8460',
  },
  proud: {
    label: 'something I am proud of',
    icon: 'leaf',
    color: '#4f8f9e',
    petal: '#74b3c0',
    petalDark: '#3f7683',
  },
  thought: {
    label: 'a passing thought',
    icon: 'cloud',
    color: '#8b7fc4',
    petal: '#a99ce0',
    petalDark: '#7a6db3',
  },
};

export const categoryMeta = (c?: ReasonCategory | null): CategoryMeta =>
  CATEGORIES[c ?? 'love'] ?? CATEGORIES.love;
