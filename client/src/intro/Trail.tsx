import { useCallback, useEffect, useRef } from 'react';

/**
 * The path she walked, kept.
 *
 * Everything the candle wakes stays lit, but the space in between goes dark
 * again the moment the light leaves it — so a minute in, the room looked the
 * same as it did at the start. This paints a faint warm smear wherever the
 * light has been and never wipes it, so by the end the room holds a drawing
 * she made without meaning to.
 *
 * It sits above the darkness layer for that reason: it is light that stayed,
 * not part of the room being lit.
 */
export function useTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = () => {
      // Repainting on resize would need the whole path history, so instead the
      // canvas keeps what it has and is simply re-scaled. A resize mid-intro is
      // rare enough that a slightly stretched trail is the right trade.
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'lighter';
      ctxRef.current = ctx;
    };

    size();
    window.addEventListener('resize', size);
    return () => window.removeEventListener('resize', size);
  }, []);

  /** Lay down one segment of warmth. Called from the room's animation frame. */
  const paint = useCallback((a: { x: number; y: number }, b: { x: number; y: number }) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    // Idling in one place would otherwise burn a hard bright blob.
    if (Math.hypot(b.x - a.x, b.y - a.y) < 2) return;

    // Two passes: a wide dim halo and a narrow warmer core.
    ctx.strokeStyle = 'rgba(255,168,86,0.030)';
    ctx.lineWidth = 74;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,214,150,0.045)';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }, []);

  return { canvasRef, paint };
}
