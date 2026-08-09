import { memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * One hand-drawn icon set for the whole site — no emoji anywhere.
 * Everything is 24×24, stroked in currentColor at 1.5, round caps.
 * The botanical and chemistry glyphs are the house motifs: tulips because she
 * loves them, molecules and glassware because that is what she does.
 */

export type IconName =
  // sections
  | 'story'
  | 'reasons'
  | 'universe'
  | 'letters'
  | 'confessions'
  | 'dates'
  | 'admin'
  // botanical
  | 'tulip'
  | 'tulip-bud'
  | 'leaf'
  | 'seedling'
  // chemistry
  | 'flask'
  | 'molecule'
  | 'benzene'
  | 'dna'
  | 'petri'
  | 'bond'
  // content
  | 'heart'
  | 'star'
  | 'moon'
  | 'sparkle'
  | 'gift'
  | 'camera'
  | 'smile'
  | 'envelope'
  | 'pin'
  | 'note'
  | 'flame'
  | 'cloud'
  // ui
  | 'plus'
  | 'close'
  | 'arrow-right'
  | 'arrow-left'
  | 'search'
  | 'trash'
  | 'edit'
  | 'lock'
  | 'unlock'
  | 'check'
  | 'play'
  | 'chevron-down';

const PATHS: Record<IconName, JSX.Element> = {
  /* ── sections ─────────────────────────────────────────────── */
  // a little house with a lit window — "our story" starts at home
  story: (
    <>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-4.5h4V20" />
      <circle cx="12" cy="11" r="1.1" />
    </>
  ),
  // tulip — the reasons section is hers
  reasons: (
    <>
      <path d="M12 3.2c-1.7 0-3.1 1.3-3.1 3.3v2.2c0 2 1.4 3.6 3.1 3.6s3.1-1.6 3.1-3.6V6.5c0-2-1.4-3.3-3.1-3.3Z" />
      <path d="M8.9 6.6c1 .9 2 1.3 3.1 1.3s2.1-.4 3.1-1.3" />
      <path d="M12 12.3V21" />
      <path d="M12 17.2c-2.5 0-4.2-1.7-4.6-4.2 2.7-.2 4.6 1.5 4.6 4.2Z" />
      <path d="M12 15.6c2.5 0 4.2-1.7 4.6-4.2-2.7-.2-4.6 1.5-4.6 4.2Z" />
    </>
  ),
  // a star with an orbit around it
  universe: (
    <>
      <path d="M12 4.2 13.5 9l4.8 1.5-4.8 1.5L12 16.8 10.5 12 5.7 10.5 10.5 9 12 4.2Z" />
      <ellipse cx="12" cy="12" rx="9" ry="4.2" transform="rotate(-24 12 12)" opacity=".5" />
    </>
  ),
  letters: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3.6 6.6 12 13l8.4-6.4" />
      <path d="M3.8 17.6 9.4 12M20.2 17.6 14.6 12" opacity=".5" />
    </>
  ),
  // a folded note with a corner turned — something half-said
  confessions: (
    <>
      <path d="M5 3.8h9.2L19 8.6V20a1.2 1.2 0 0 1-1.2 1.2H5A1.2 1.2 0 0 1 3.8 20V5A1.2 1.2 0 0 1 5 3.8Z" />
      <path d="M14 3.8v4.9h5" />
      <path d="M7.2 12.6h6.4M7.2 16h4.2" opacity=".6" />
    </>
  ),
  dates: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.8h17" />
      <path d="M8 3.5v3M16 3.5v3" />
      <circle cx="12" cy="15" r="1.6" />
    </>
  ),
  // a key shaped like a small flask — the private door
  admin: (
    <>
      <circle cx="8" cy="8" r="3.6" />
      <path d="M10.6 10.6 20 20" />
      <path d="M17.2 17.2 15.4 19M19 19l-1.6 1.8" />
    </>
  ),

  /* ── botanical ────────────────────────────────────────────── */
  tulip: (
    <>
      <path d="M12 3.2c-1.7 0-3.1 1.3-3.1 3.3v2.2c0 2 1.4 3.6 3.1 3.6s3.1-1.6 3.1-3.6V6.5c0-2-1.4-3.3-3.1-3.3Z" />
      <path d="M8.9 6.6c1 .9 2 1.3 3.1 1.3s2.1-.4 3.1-1.3" />
      <path d="M12 12.3V21" />
      <path d="M12 17.2c-2.5 0-4.2-1.7-4.6-4.2 2.7-.2 4.6 1.5 4.6 4.2Z" />
      <path d="M12 15.6c2.5 0 4.2-1.7 4.6-4.2-2.7-.2-4.6 1.5-4.6 4.2Z" />
    </>
  ),
  'tulip-bud': (
    <>
      <path d="M12 3.6c-1.5 0-2.7 1.2-2.7 3v2.6c0 1.8 1.2 3.2 2.7 3.2s2.7-1.4 2.7-3.2V6.6c0-1.8-1.2-3-2.7-3Z" />
      <path d="M12 12.4V21" />
    </>
  ),
  leaf: (
    <>
      <path d="M4.5 19.5C3 14 6.5 5.5 19.5 4.5c1 13-7.5 16.5-13 15Z" />
      <path d="M19.5 4.5 8.5 15.5" opacity=".6" />
    </>
  ),
  seedling: (
    <>
      <path d="M12 21v-8" />
      <path d="M12 15.5c-3 0-5-2-5.4-5.2 3.2-.3 5.4 1.9 5.4 5.2Z" />
      <path d="M12 13.4c2.7 0 4.6-1.8 5-4.8-2.9-.3-5 1.7-5 4.8Z" />
    </>
  ),

  /* ── chemistry ────────────────────────────────────────────── */
  flask: (
    <>
      <path d="M9.5 3.5h5" />
      <path d="M10.2 3.5v5.7L5 18.2A1.7 1.7 0 0 0 6.5 20.8h11a1.7 1.7 0 0 0 1.5-2.6l-5.2-9V3.5" />
      <path d="M7.4 14.6h9.2" opacity=".6" />
      <circle cx="10.6" cy="17.2" r=".8" opacity=".6" />
      <circle cx="13.8" cy="18" r=".6" opacity=".6" />
    </>
  ),
  molecule: (
    <>
      <circle cx="12" cy="5.4" r="2.2" />
      <circle cx="5.4" cy="16.6" r="2.2" />
      <circle cx="18.6" cy="16.6" r="2.2" />
      <path d="M10.6 7.3 6.8 14.7M13.4 7.3l3.8 7.4M7.6 16.6h8.8" />
    </>
  ),
  benzene: (
    <>
      <path d="M12 3.4 19.4 7.7v8.6L12 20.6 4.6 16.3V7.7Z" />
      <circle cx="12" cy="12" r="3.6" opacity=".5" />
    </>
  ),
  dna: (
    <>
      <path d="M7 3c0 4.5 10 5.5 10 9s-10 4.5-10 9" />
      <path d="M17 3c0 4.5-10 5.5-10 9s10 4.5 10 9" />
      <path d="M8.4 6.4h7.2M7.2 9.6h9.6M7.2 14.4h9.6M8.4 17.6h7.2" opacity=".55" />
    </>
  ),
  petri: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="6.4" opacity=".45" />
      <circle cx="10" cy="10.4" r="1.1" opacity=".7" />
      <circle cx="14.2" cy="13.4" r=".8" opacity=".7" />
      <circle cx="11.4" cy="14.6" r=".6" opacity=".7" />
    </>
  ),
  bond: (
    <>
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="18" cy="12" r="2.4" />
      <path d="M8.4 10.8h7.2M8.4 13.2h7.2" />
    </>
  ),

  /* ── content ──────────────────────────────────────────────── */
  heart: (
    <path d="M12 20.4S3.6 15.3 3.6 9.4a4.4 4.4 0 0 1 8.4-1.8 4.4 4.4 0 0 1 8.4 1.8c0 5.9-8.4 11-8.4 11Z" />
  ),
  star: (
    <path d="M12 3.6 14.5 9.2l6.1.6-4.6 4 1.4 6-5.4-3.2-5.4 3.2 1.4-6-4.6-4 6.1-.6Z" />
  ),
  moon: <path d="M20 14.4A8.4 8.4 0 0 1 9.6 4 8.6 8.6 0 1 0 20 14.4Z" />,
  sparkle: (
    <>
      <path d="M12 3.5 13.4 9l5.5 1.4-5.5 1.4L12 17.3l-1.4-5.5L5.1 10.4 10.6 9Z" />
      <path d="M18.4 16.2l.7 2.2 2.2.7-2.2.7-.7 2.2-.7-2.2-2.2-.7 2.2-.7Z" opacity=".6" />
    </>
  ),
  gift: (
    <>
      <rect x="3.6" y="9.6" width="16.8" height="11" rx="1.6" />
      <path d="M3.6 13.4h16.8M12 9.6v11" />
      <path d="M12 9.6S10.6 4.4 8 4.4a2.2 2.2 0 0 0 0 4.4h4Zm0 0s1.4-5.2 4-5.2a2.2 2.2 0 0 1 0 4.4h-4Z" />
    </>
  ),
  camera: (
    <>
      <path d="M3.6 8.6h3.2l1.6-2.4h7.2l1.6 2.4h3.2a1.4 1.4 0 0 1 1.4 1.4v8a1.4 1.4 0 0 1-1.4 1.4H3.6A1.4 1.4 0 0 1 2.2 18v-8a1.4 1.4 0 0 1 1.4-1.4Z" />
      <circle cx="12" cy="13.6" r="3.4" />
    </>
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M8.4 13.6c.9 1.6 2.1 2.4 3.6 2.4s2.7-.8 3.6-2.4" />
      <path d="M9.2 9.6h.01M14.8 9.6h.01" strokeWidth="2" />
    </>
  ),
  envelope: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3.6 6.6 12 13l8.4-6.4" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.6-6.1 6.6-10.6a6.6 6.6 0 1 0-13.2 0C5.4 14.9 12 21 12 21Z" />
      <circle cx="12" cy="10.2" r="2.4" />
    </>
  ),
  note: (
    <>
      <rect x="4.2" y="3.6" width="15.6" height="16.8" rx="1.8" />
      <path d="M7.8 8.4h8.4M7.8 12h8.4M7.8 15.6h5.4" opacity=".7" />
    </>
  ),
  flame: (
    <path d="M12 21c3.6 0 6-2.4 6-5.6 0-4-4.2-5.6-3.4-10.4-2.4 1-4.2 3.2-4.2 5.6 0 1.2-.8 1.8-1.6 1.4-.8-.4-1-1.4-1-2.4C6 11.4 6 13.2 6 15.4 6 18.6 8.4 21 12 21Z" />
  ),
  cloud: (
    <path d="M7.4 18.4h9.8a3.8 3.8 0 0 0 .4-7.6 5.4 5.4 0 0 0-10.4-1.2 3.9 3.9 0 0 0 .2 8.8Z" />
  ),

  /* ── ui ───────────────────────────────────────────────────── */
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  close: <path d="M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6" />,
  'arrow-right': <path d="M4.5 12h15M13.5 6l6 6-6 6" />,
  'arrow-left': <path d="M19.5 12h-15M10.5 6l-6 6 6 6" />,
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.6" />
      <path d="M15.6 15.6 20.5 20.5" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6.6h15M9.4 6.6V4.8a1.2 1.2 0 0 1 1.2-1.2h2.8a1.2 1.2 0 0 1 1.2 1.2v1.8" />
      <path d="M6.4 6.6 7.3 19a1.4 1.4 0 0 0 1.4 1.3h6.6a1.4 1.4 0 0 0 1.4-1.3l.9-12.4" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4l10-10-4-4L4 16v4Z" />
      <path d="M13.4 6.6 17.4 10.6" />
    </>
  ),
  lock: (
    <>
      <rect x="4.8" y="10.4" width="14.4" height="10" rx="2" />
      <path d="M8.4 10.4V7.8a3.6 3.6 0 0 1 7.2 0v2.6" />
      <circle cx="12" cy="15.4" r="1.2" />
    </>
  ),
  unlock: (
    <>
      <rect x="4.8" y="10.4" width="14.4" height="10" rx="2" />
      <path d="M8.4 10.4V7.8a3.6 3.6 0 0 1 6.9-1.3" />
      <circle cx="12" cy="15.4" r="1.2" />
    </>
  ),
  check: <path d="M5 12.6 9.8 17.4 19 6.6" />,
  play: <path d="M8.4 5.6 18.4 12l-10 6.4V5.6Z" />,
  'chevron-down': <path d="M6 9.5 12 15.5 18 9.5" />,
};

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  /** Fill the shape instead of stroking it — for hearts, stars, small marks. */
  filled?: boolean;
  strokeWidth?: number;
  title?: string;
}

function IconBase({ name, size = 20, className, filled, strokeWidth = 1.5, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {PATHS[name]}
    </svg>
  );
}

export const Icon = memo(IconBase);
