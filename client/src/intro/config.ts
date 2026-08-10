/**
 * EVERYTHING YOU WRITE FOR THE INTRO LIVES HERE.
 *
 * The intro is a one-night thing, so it is a file rather than another admin
 * screen — edit, save, done. All copy below is placeholder; replace it.
 *
 * Coordinates are fractions of the room, which is 2 screens wide and 2 tall:
 *   x: 0 = far left, 1 = far right
 *   y: 0 = ceiling,  1 = floor
 * Keep them roughly inside 0.05–0.95 so nothing hides in a corner she can't reach.
 */

export type FindKind = 'bloom' | 'seal' | 'lift' | 'flip' | 'hold' | 'wake';

export interface IntroFind {
  id: string;
  /** Which object it is, and therefore how it opens. */
  kind: FindKind;
  x: number;
  y: number;
  /** Shown in handwriting when she opens it. This is the bit you write. */
  line: string;
  /** Optional — a photo revealed with it. Any URL, or a Cloudinary one. */
  photo?: string;
  /** Optional caption under the photo. */
  caption?: string;
}

/**
 * Ordered easy → hard. The first sits near where she starts; the last is
 * tucked away. Six lands around three minutes.
 */
export const FINDS: IntroFind[] = [
  {
    id: 'tulip',
    kind: 'bloom',
    x: 0.22,
    y: 0.58,
    line: 'Placeholder — something about the first time you saw her.',
  },
  {
    id: 'letter',
    kind: 'seal',
    x: 0.72,
    y: 0.3,
    line: 'Placeholder — a line you never said out loud.',
  },
  {
    id: 'photo-1',
    kind: 'flip',
    x: 0.42,
    y: 0.82,
    line: 'Placeholder — what was happening in this photo.',
    photo: '',
    caption: 'add a photo url in intro/config.ts',
  },
  {
    id: 'star',
    kind: 'lift',
    x: 0.86,
    y: 0.14,
    line: 'Placeholder — something you think about at night.',
  },
  {
    id: 'helix',
    kind: 'hold',
    x: 0.12,
    y: 0.22,
    line: 'Placeholder — hold this one. Something that took you a while to say.',
  },
  {
    id: 'cat',
    kind: 'wake',
    x: 0.9,
    y: 0.88,
    line: 'Placeholder — he has been waiting to show you something.',
  },
];

export const INTRO_COPY = {
  /** The very first thing on screen, before she has done anything. */
  openingHint: 'it is dark in here',
  /** The second line, after a beat. */
  openingNudge: 'move the light',
  /** Shown once she has found everything. */
  doorPrompt: 'he wants you to follow him',
  /** The counter, e.g. "2 of 6 found". */
  progressLabel: 'found',
  skip: 'skip',
};

export const FINALE = {
  /** The big one. */
  title: 'Happy birthday, Shree',
  /** Underneath it, smaller. */
  subtitle: 'Placeholder — one sentence. The one you actually mean.',
  /** The button into the site. */
  cta: 'come in',
  /**
   * Photos that fly in at the end. Leave empty to use the most recent images
   * from the media library instead.
   */
  photos: [] as string[],
  /** How many library photos to pull if the list above is empty. */
  libraryFallbackCount: 12,
};
