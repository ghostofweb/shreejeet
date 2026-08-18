/**
 * EVERYTHING YOU WRITE FOR THE INTRO LIVES HERE.
 *
 * Four beats, about ninety seconds, and she never has to work anything out:
 *
 *   1. a cord hangs in the dark — she pulls it, and gets a candle
 *   2. a dark room that wakes wherever the candle goes, and remembers where
 *      she walked; three envelopes are lying about with a line each
 *   3. a cake — hold to blow out the candles
 *   4. black, a beat of silence, and then the birthday moment
 */

export const INTRO_COPY = {
  /** Beat 1 — on screen while the cord is still hanging. */
  cordHint: 'there is a light in here somewhere',
  /** Beat 2 — before she has moved the candle. */
  openingHint: 'it is dark in here',
  /** Appears a beat later. */
  openingNudge: 'move the light around',
  skip: 'skip',
};

/**
 * Beat 2, ambient. Shown small at the bottom, one at a time, as more of the
 * room wakes up. Keep them short — they sit over the top of everything.
 */
export const INTRO_LINES: string[] = [
  'you found the light.',
  'keep going.',
  'nearly there.',
];

/**
 * Beat 2, the good ones. Three envelopes are lying around the room. Passing
 * the candle over one opens it and shows the line big, in handwriting, for a
 * few seconds. She is not required to find them — which is exactly why finding
 * one feels like a secret. Put the lines you actually mean here.
 */
export const INTRO_NOTES: string[] = [
  'Your the best thing ever happened to me love',
  'I cant wait for our future and what it holds for us.',
  'I love you so much',
];

/** Beat 3 — the cake. */
export const WISH = {
  prompt: 'make a wish',
  /** Under the prompt, small. */
  hint: 'press and hold',
  /** While she is holding. */
  holding: 'keep holding',
  /** How many candles are on the cake. */
  candles: 5,
};

export const FINALE = {
  /** Written on, left to right, in handwriting, out of the dark. The moment. */
  title: 'Happy birthday, Shree',
  /** Underneath, smaller. */
  subtitle: 'This is for you my love',
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
