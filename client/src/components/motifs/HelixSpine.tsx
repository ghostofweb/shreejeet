import { memo, useMemo } from 'react';
import { motion, type MotionValue } from 'framer-motion';

/**
 * The timeline's spine is a DNA double helix rather than a plain line — her
 * field, drawn as the thread the whole story hangs off.
 *
 * Two sine strands plus base-pair rungs, rendered once into a tall SVG with
 * `preserveAspectRatio="none"` so it stretches to whatever height the timeline
 * ends up being. `progress` reveals it from the top as she scrolls.
 */
export const HelixSpine = memo(function HelixSpine({
  progress,
  accent,
  width = 34,
  turns = 26,
}: {
  /** 0→1 scroll progress; drives the reveal mask. */
  progress: MotionValue<number>;
  accent: string;
  width?: number;
  /** How many full twists over the whole height. */
  turns?: number;
}) {
  const H = 1000; // virtual height; the SVG stretches to fit
  const W = 100;

  const { strandA, strandB, rungs } = useMemo(() => {
    const steps = turns * 12;
    const amp = W / 2 - 8;
    const mid = W / 2;

    let a = '';
    let b = '';
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = t * H;
      const phase = t * turns * Math.PI * 2;
      const xa = mid + Math.sin(phase) * amp;
      const xb = mid + Math.sin(phase + Math.PI) * amp;
      a += `${i === 0 ? 'M' : 'L'}${xa.toFixed(2)} ${y.toFixed(2)} `;
      b += `${i === 0 ? 'M' : 'L'}${xb.toFixed(2)} ${y.toFixed(2)} `;
    }

    // Base pairs, drawn only where the strands are far enough apart to read.
    const bars: { y: number; x1: number; x2: number; o: number }[] = [];
    const rungCount = turns * 5;
    for (let i = 0; i <= rungCount; i++) {
      const t = i / rungCount;
      const phase = t * turns * Math.PI * 2;
      const spread = Math.abs(Math.sin(phase));
      if (spread < 0.25) continue;
      bars.push({
        y: t * H,
        x1: mid + Math.sin(phase) * amp,
        x2: mid + Math.sin(phase + Math.PI) * amp,
        o: 0.15 + spread * 0.5,
      });
    }

    return { strandA: a, strandB: b, rungs: bars };
  }, [turns]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      width={width}
      className="h-full w-full"
      aria-hidden
    >
      <defs>
        {/* the helix fades in from the top as she scrolls past it */}
        <linearGradient id="helix-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="88%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="helix-mask">
          <motion.rect
            x="0"
            y="0"
            width={W}
            fill="url(#helix-fade)"
            style={{ scaleY: progress, originY: 0 }}
            height={H}
          />
        </mask>
      </defs>

      {/* unlit helix — always visible, very faint, so the path ahead is implied */}
      <g stroke={accent} fill="none" opacity="0.12" strokeWidth="2.2" strokeLinecap="round">
        <path d={strandA} vectorEffect="non-scaling-stroke" />
        <path d={strandB} vectorEffect="non-scaling-stroke" />
      </g>

      {/* lit helix — revealed by scroll */}
      <g mask="url(#helix-mask)">
        <g stroke={accent} fill="none" strokeWidth="2.4" strokeLinecap="round" opacity="0.95">
          <path d={strandA} vectorEffect="non-scaling-stroke" />
          <path d={strandB} vectorEffect="non-scaling-stroke" />
        </g>
        {rungs.map((r, i) => (
          <line
            key={i}
            x1={r.x1}
            y1={r.y}
            x2={r.x2}
            y2={r.y}
            stroke={accent}
            strokeWidth="1.4"
            opacity={r.o}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </svg>
  );
});
