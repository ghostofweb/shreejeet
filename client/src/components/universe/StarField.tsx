import { useCallback, useEffect, useMemo, useRef } from 'react';
import { starMeta } from '@/lib/starTypes';
import type { UniverseStar } from '@/lib/types';

/**
 * The night sky, drawn on a 2D canvas.
 *
 * Deliberately not WebGL: a few hundred sprites with additive glow is well
 * within canvas2d's budget, it costs no extra bundle, and it behaves on phones
 * that throttle or lose a WebGL context.
 *
 * World space is in arbitrary units; the camera holds a pan offset and a zoom.
 * Depth (z) only drives parallax and size, so it reads as 3D without being 3D.
 */

interface Decorative {
  x: number;
  y: number;
  z: number;
  r: number;
  phase: number;
  speed: number;
  base: number;
}

export interface StarFieldHandle {
  focus: (id: string) => void;
}

interface Props {
  stars: UniverseStar[];
  /** Ids of secret stars already discovered — they stay visible once found. */
  discovered: Set<string>;
  onDiscover: (id: string) => void;
  onSelect: (star: UniverseStar) => void;
  onHoverChange?: (star: UniverseStar | null) => void;
}

const MIN_ZOOM = 0.55;
const MAX_ZOOM = 2.6;
/** Pixels per world unit at zoom 1. */
const SPREAD = 12;
/** Stored star z ranges about ±20; the projector wants ±1. */
const Z_SCALE = 20;
/** How close the pointer must get before a secret star reveals itself. */
const DISCOVERY_RADIUS = 90;
/** Movement below this many px still counts as a tap, not a drag. */
const DRAG_THRESHOLD = 6;

function makeDecorative(count: number, seed: number): Decorative[] {
  let s = seed;
  const rnd = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  return Array.from({ length: count }, () => {
    const z = rnd() * 2 - 1;
    return {
      x: (rnd() - 0.5) * 240,
      y: (rnd() - 0.5) * 160,
      z,
      r: 0.35 + rnd() * 1.5,
      phase: rnd() * Math.PI * 2,
      speed: 0.35 + rnd() * 1.1,
      base: 0.22 + rnd() * 0.55,
    };
  });
}

/** Stored position → projector space, with depth squashed into [-1, 1]. */
const np = (s: UniverseStar) => ({
  x: s.position.x,
  y: s.position.y,
  z: Math.max(-1, Math.min(1, s.position.z / Z_SCALE)),
});

export function StarField({ stars, discovered, onDiscover, onSelect, onHoverChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cam = useRef({ x: 0, y: 0, zoom: 1, tx: 0, ty: 0, tzoom: 1 });
  const pointer = useRef({ x: 0, y: 0, inside: false, downAt: 0, dragging: false, moved: 0 });
  const hovered = useRef<UniverseStar | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const decorative = useMemo(() => {
    const narrow = typeof window !== 'undefined' && window.innerWidth < 768;
    return makeDecorative(narrow ? 380 : 900, 20260503);
  }, []);

  /** Constellations: stars sharing a groupKey get joined by a molecular bond. */
  const bonds = useMemo(() => {
    const groups = new Map<string, UniverseStar[]>();
    for (const s of stars) {
      if (!s.groupKey) continue;
      const list = groups.get(s.groupKey) ?? [];
      list.push(s);
      groups.set(s.groupKey, list);
    }
    const pairs: [UniverseStar, UniverseStar][] = [];
    for (const list of groups.values()) {
      const sorted = [...list].sort((a, b) => a.position.x - b.position.x);
      for (let i = 0; i < sorted.length - 1; i++) pairs.push([sorted[i], sorted[i + 1]]);
    }
    return pairs;
  }, [stars]);

  /** Which meaningful stars are currently drawable. */
  const visibleStars = useMemo(
    () => stars.filter((s) => !s.isSecret || discovered.has(s.id)),
    [stars, discovered]
  );
  const visibleRef = useRef(visibleStars);
  visibleRef.current = visibleStars;
  const starsRef = useRef(stars);
  starsRef.current = stars;
  const discoveredRef = useRef(discovered);
  discoveredRef.current = discovered;

  /**
   * `z` must already be normalised to roughly [-1, 1]. Stored stars use a much
   * wider range, so they are normalised on the way in — feeding raw z here
   * makes the parallax factor go negative and throws stars off the sky.
   */
  const project = useCallback((s: { x: number; y: number; z: number }) => {
    const { w, h } = sizeRef.current;
    const c = cam.current;
    const par = 1 + s.z * 0.35;
    return {
      sx: w / 2 + (s.x - c.x * par) * c.zoom * par * SPREAD,
      sy: h / 2 + (s.y - c.y * par) * c.zoom * par * SPREAD,
      par,
    };
  }, []);

  const hitTest = useCallback(
    (px: number, py: number): UniverseStar | null => {
      let best: UniverseStar | null = null;
      let bestDist = Infinity;
      for (const s of visibleRef.current) {
        const { sx, sy } = project(np(s));
        const d = Math.hypot(sx - px, sy - py);
        // A generous target: 22px minimum so it stays tappable on a phone.
        if (d < Math.max(22, 26 * cam.current.zoom) && d < bestDist) {
          bestDist = d;
          best = s;
        }
      }
      return best;
    },
    [project]
  );

  /* ── Render loop ─────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let frame = 0;
    let running = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h, dpr };
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (time: number) => {
      if (!running) return;
      const t = time / 1000;
      const { w, h } = sizeRef.current;
      const c = cam.current;

      // Ease the camera toward its target — pans and zooms always feel weighted.
      c.x += (c.tx - c.x) * 0.08;
      c.y += (c.ty - c.y) * 0.08;
      c.zoom += (c.tzoom - c.zoom) * 0.09;

      // deep space
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#05050c');
      bg.addColorStop(0.55, '#0b0a1a');
      bg.addColorStop(1, '#140f24');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // a faint galactic band so the sky isn't uniform
      const band = ctx.createLinearGradient(0, h * 0.25, w, h * 0.75);
      band.addColorStop(0, 'rgba(120,110,200,0)');
      band.addColorStop(0.5, 'rgba(150,130,220,0.10)');
      band.addColorStop(1, 'rgba(120,110,200,0)');
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, w, h);

      /* decorative stars */
      for (const d of decorative) {
        const { sx, sy, par } = project(d);
        if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;
        const tw = reduced ? 1 : 0.65 + 0.35 * Math.sin(t * d.speed + d.phase);
        ctx.globalAlpha = d.base * tw;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, d.r * par * c.zoom, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      /* constellation bonds — drawn as double lines, like a chemical bond */
      for (const [a, b] of bonds) {
        if (a.isSecret && !discoveredRef.current.has(a.id)) continue;
        if (b.isSecret && !discoveredRef.current.has(b.id)) continue;
        const pa = project(np(a));
        const pb = project(np(b));
        const dx = pb.sx - pa.sx;
        const dy = pb.sy - pa.sy;
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * 1.6;
        const ny = (dx / len) * 1.6;
        ctx.strokeStyle = 'rgba(180,190,255,0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pa.sx + nx, pa.sy + ny);
        ctx.lineTo(pb.sx + nx, pb.sy + ny);
        ctx.moveTo(pa.sx - nx, pa.sy - ny);
        ctx.lineTo(pb.sx - nx, pb.sy - ny);
        ctx.stroke();
      }

      /* meaningful stars */
      for (const s of visibleRef.current) {
        const { sx, sy, par } = project(np(s));
        if (sx < -60 || sx > w + 60 || sy < -60 || sy > h + 60) continue;

        const meta = starMeta(s.type);
        const locked = !!s.locked;
        const pulse = reduced ? 1 : 0.82 + 0.18 * Math.sin(t * 1.25 + s.colorSeed * 9);
        const isHover = hovered.current?.id === s.id;
        const R = (locked ? 2.4 : 3.4) * par * c.zoom * (isHover ? 1.35 : 1);

        // glow
        const glowR = R * (locked ? 4 : 8) * pulse;
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
        const col = locked ? '#7b7fa8' : meta.color;
        g.addColorStop(0, hexA(col, locked ? 0.35 : 0.75));
        g.addColorStop(0.4, hexA(col, locked ? 0.1 : 0.22));
        g.addColorStop(1, hexA(col, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
        ctx.fill();

        // core
        ctx.fillStyle = locked ? '#9aa0c8' : '#fffdf7';
        ctx.beginPath();
        ctx.arc(sx, sy, R * pulse, 0, Math.PI * 2);
        ctx.fill();

        // hover ring
        if (isHover) {
          ctx.strokeStyle = hexA(col, 0.7);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(sx, sy, R * 4.6, 0, Math.PI * 2);
          ctx.stroke();
        }

        // locked stars wear a small broken ring
        if (locked) {
          ctx.strokeStyle = 'rgba(190,195,225,0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(sx, sy, R * 3.2, 0.6, Math.PI - 0.6);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(sx, sy, R * 3.2, Math.PI + 0.6, Math.PI * 2 - 0.6);
          ctx.stroke();
        }
      }

      /* secret stars shimmer faintly when the pointer is near enough */
      if (pointer.current.inside) {
        for (const s of starsRef.current) {
          if (!s.isSecret || discoveredRef.current.has(s.id)) continue;
          const { sx, sy } = project(np(s));
          const d = Math.hypot(sx - pointer.current.x, sy - pointer.current.y);
          if (d > DISCOVERY_RADIUS) continue;
          const strength = 1 - d / DISCOVERY_RADIUS;
          ctx.globalAlpha = strength * 0.9;
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 26 * strength + 6);
          g.addColorStop(0, 'rgba(230,200,255,0.9)');
          g.addColorStop(1, 'rgba(230,200,255,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(sx, sy, 26 * strength + 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          if (strength > 0.55) onDiscover(s.id);
        }
      }

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [decorative, bonds, project, reduced, onDiscover]);

  /* ── Interaction ─────────────────────────────────────────── */
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const prev = pointer.current;

    if (prev.dragging) {
      const dx = px - prev.x;
      const dy = py - prev.y;
      prev.moved += Math.abs(dx) + Math.abs(dy);
      // Dead-zone: a tap always carries a pixel or two of jitter, and panning
      // on that would swallow the click.
      if (prev.moved > DRAG_THRESHOLD) {
        cam.current.tx -= dx / (cam.current.zoom * SPREAD);
        cam.current.ty -= dy / (cam.current.zoom * SPREAD);
      }
    }

    pointer.current = { ...prev, x: px, y: py, inside: true };

    const hit = hitTest(px, py);
    if (hit?.id !== hovered.current?.id) {
      hovered.current = hit;
      onHoverChange?.(hit);
      e.currentTarget.style.cursor = hit ? 'pointer' : prev.dragging ? 'grabbing' : 'grab';
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointer.current.dragging = true;
    pointer.current.moved = 0;
    pointer.current.downAt = performance.now();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const wasDrag = pointer.current.moved > DRAG_THRESHOLD;
    pointer.current.dragging = false;
    e.currentTarget.style.cursor = 'grab';
    if (wasDrag) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
    if (hit) onSelect(hit);
  };

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const next = cam.current.tzoom * (e.deltaY > 0 ? 0.9 : 1.1);
    cam.current.tzoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={() => {
        pointer.current.inside = false;
        pointer.current.dragging = false;
        hovered.current = null;
        onHoverChange?.(null);
      }}
      onWheel={onWheel}
      className="absolute inset-0 h-full w-full touch-none"
      style={{ cursor: 'grab' }}
      aria-hidden
    />
  );
}

/** '#rrggbb' + alpha → rgba() string. */
function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
