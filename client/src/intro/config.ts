/**
 * EVERYTHING YOU WRITE FOR THE INTRO LIVES HERE.
 *
 * The intro asks nothing of her. She moves a candle through a dark room and
 * everything it touches wakes up — flowers open, stars lift, fireflies scatter.
 * There is nothing to find, nothing to get wrong, and no counter. When most of
 * the room is awake it all rises, and the birthday moment happens.
 */

export const INTRO_COPY = {
  /** On screen before she has moved anything. */
  openingHint: 'it is dark in here',
  /** Appears a beat later. */
  openingNudge: 'move the light around',
  skip: 'skip',
};

/**
 * Shown one at a time as more of the room wakes up, roughly every fifth of the
 * way. Keep them short — they appear over the top of everything.
 */
export const INTRO_LINES: string[] = [
  'Placeholder — you found the light.',
  'Placeholder — keep going.',
  'Placeholder — something you would say to her here.',
  'Placeholder — nearly there.',
];

export const FINALE = {
  /** Written on, letter by letter, in handwriting. The moment. */
  title: 'Happy birthday, Shree',
  /** Underneath, smaller. */
  subtitle: 'Placeholder — one sentence. The one you actually mean.',
  /** The button into the site. */
  cta: 'come in',
  /**
   * Photos that fly in and orbit her name. Leave empty to use the most recent
   * images from the media library instead.
   */
  photos: [] as string[],
  /** How many library photos to pull if the list above is empty. */
  libraryFallbackCount: 14,
};
