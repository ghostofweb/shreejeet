import { memo, useMemo } from 'react';
import { motion, type MotionValue } from 'framer-motion';
import { helixWidth, spineX, TURN_PX, type SpineGeo } from '@/lib/spine';

/**
 * The timeline's spine: a DNA double helix twisting around a path that wanders
 * left and right down the page — her field, drawn as the route the whole story
 * follows.
 *
 * Drawn in real pixels rather than a stretched viewBox. The old version used
 * `preserveAspectRatio="none"`, which meant the twist got squashed or smeared
 * depending on how many memories there were; here the geometry is generated
 * against the measured track, so a turn is always a turn.
 *
 * Performance note: this SVG is a few thousand segments and is painted **once**.
 * The scroll reveal used to be an SVG `<mask>` driven by a motion value, which
 * forced the browser to re-rasterise every one of those segments through an
 * offscreen buffer on every frame — the single most expensive thing on the
 * page. It is now a `clip-path: inset()` on a plain wrapper div, which the
 * compositor can handle without repainting the artwork at all.
 */
export const HelixSpine = memo(function HelixSpine({
  geo,
  reveal,
  accent,
}: {
  geo: SpineGeo;
  /** 0→1 scroll progress, already turned into a clip-path inset string. */
  reveal: MotionValue<string>;
  accent: string;
}) {
  const art = useMemo(() => {
    if (!geo.w || !geo.h) return null;

    const { h } = geo;
    const hw = helixWidth(geo);
    // ~25 samples per turn keeps the twist round without exploding the path.
    const step = Math.max(4, TURN_PX / 25);
    const n = Math.ceil(h / step);

    let a = '';
    let b = '';
    for (let i = 0; i <= n; i++) {
      const y = Math.min(h, i * step);
      const t = y / h;
      const centre = spineX(t, geo);
      const phase = (y / TURN_PX) * Math.PI * 2;
      const off = Math.sin(phase) * hw;
      a += `${i === 0 ? 'M' : 'L'}${(centre + off).toFixed(1)} ${y.toFixed(1)} `;
      b += `${i === 0 ? 'M' : 'L'}${(centre - off).toFixed(1)} ${y.toFixed(1)} `;
    }

    // Base pairs, only where the strands are far enough apart to read as rungs.
    const rungs: { y: number; x1: number; x2: number; o: number }[] = [];
    const rungStep = TURN_PX / 5;
    for (let y = 0; y <= h; y += rungStep) {
      const phase = (y / TURN_PX) * Math.PI * 2;
      const spread = Math.abs(Math.sin(phase));
      if (spread < 0.28) continue;
      const centre = spineX(y / h, geo);
      const off = Math.sin(phase) * hw;
      rungs.push({ y, x1: centre + off, x2: centre - off, o: 0.14 + spread * 0.46 });
    }

    return { a, b, rungs };
  }, [geo]);

  if (!art) return null;

  return (
    <div className="absolute inset-0">
      {/* unlit — always there, very faint, so the route ahead is implied */}
      <Strands art={art} geo={geo} accent={accent} opacity={0.13} />

      {/* lit — clipped from the bottom as she scrolls, on the compositor */}
      <motion.div
        className="absolute inset-0"
        style={{ clipPath: reveal, WebkitClipPath: reveal, willChange: 'clip-path' }}
      >
        <Strands art={art} geo={geo} accent={accent} opacity={0.95} rungs />
      </motion.div>
    </div>
  );
});

function Strands({
  art,
  geo,
  accent,
  opacity,
  rungs = false,
}: {
  art: { a: string; b: string; rungs: { y: number; x1: number; x2: number; o: number }[] };
  geo: SpineGeo;
  accent: string;
  opacity: number;
  rungs?: boolean;
}) {
  return (
    <svg
      width={geo.w}
      height={geo.h}
      viewBox={`0 0 ${geo.w} ${geo.h}`}
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      {rungs &&
        art.rungs.map((r, i) => (
          <line
            key={i}
            x1={r.x1}
            y1={r.y}
            x2={r.x2}
            y2={r.y}
            stroke={accent}
            strokeWidth="1.4"
            opacity={r.o}
          />
        ))}
      <g stroke={accent} fill="none" strokeWidth="2.3" strokeLinecap="round" opacity={opacity}>
        <path d={art.a} />
        <path d={art.b} />
      </g>
    </svg>
  );
}
