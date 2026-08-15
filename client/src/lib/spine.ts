/**
 * The shape of the timeline's spine.
 *
 * It used to be a straight vertical strip with the helix twisting inside it,
 * which read as a ruler down the page. Now the whole spine wanders left and
 * right as it descends, and the helix twists around *that* — so the story has
 * a route rather than a margin.
 *
 * Everything that has to sit on the spine — the drawn helix, the benzene node
 * marking each memory, the cat walking down it — reads its x from `spineX`
 * here, so they can never drift apart.
 *
 * All values are in pixels relative to the timeline track's own box, and `t`
 * is 0→1 from the top of the track to the bottom.
 */

export interface SpineGeo {
  /** Track width in px. */
  w: number;
  /** Track height in px. */
  h: number;
  /** Under sm: the spine lives in a narrow lane down the left edge. */
  mobile: boolean;
}

export const EMPTY_GEO: SpineGeo = { w: 0, h: 0, mobile: false };

/** Centre of the lane the spine wanders around. */
export function spineCentre(geo: SpineGeo): number {
  // 34 on a phone puts the node's left edge at x=1 at the far end of the
  // swing — on the screen, but only just.
  return geo.mobile ? 34 : geo.w / 2;
}

/** How far it is allowed to wander either side of that centre. */
export function spineAmp(geo: SpineGeo): number {
  // On a phone there is only a gutter to play in, so the swing is small — just
  // enough to stop it reading as a straight rule.
  // The desktop swing is bounded by what the text columns can give up: the
  // event gutters have to clear amplitude + node radius, so anything wider
  // starts eating the reading width.
  return geo.mobile ? 11 : Math.min(110, geo.w * 0.07);
}

/** Full swings over the whole track — roughly one per screen and a half. */
export function spineWaves(geo: SpineGeo): number {
  return Math.max(2, Math.round(geo.h / 1500));
}

/**
 * Two sines rather than one. A single sine is recognisably a sine; adding a
 * faster, quieter second wave at a non-integer ratio makes the path wander
 * instead of oscillate, and it never repeats exactly.
 */
function shape(u: number): number {
  return 0.78 * Math.sin(u) + 0.22 * Math.sin(u * 2.37 + 1.1);
}

function shapeSlope(u: number): number {
  return 0.78 * Math.cos(u) + 0.22 * 2.37 * Math.cos(u * 2.37 + 1.1);
}

/** Where the spine is, horizontally, a fraction `t` of the way down. */
export function spineX(t: number, geo: SpineGeo): number {
  if (!geo.h) return spineCentre(geo);
  const u = t * spineWaves(geo) * Math.PI * 2;
  return spineCentre(geo) + spineAmp(geo) * shape(u);
}

/** dx/dy at `t` — how steeply the path is cutting across, for leaning into bends. */
export function spineSlope(t: number, geo: SpineGeo): number {
  if (!geo.h) return 0;
  const waves = spineWaves(geo);
  const u = t * waves * Math.PI * 2;
  const dxdt = spineAmp(geo) * waves * Math.PI * 2 * shapeSlope(u);
  return dxdt / geo.h;
}

/** A turn of the double helix takes this many pixels of descent. */
export const TURN_PX = 150;

/** Half-width of the helix twisting around the spine. */
export function helixWidth(geo: SpineGeo): number {
  return geo.mobile ? 9 : 15;
}
