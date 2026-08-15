import { useLayoutEffect, useState, type RefObject } from 'react';
import { EMPTY_GEO, type SpineGeo } from '@/lib/spine';

/** Distance from a memory's top edge to the centre of its node on the spine. */
export const NODE_CENTRE = 26;

/**
 * Measures the timeline track, and where each memory sits inside it.
 *
 * The spine, the nodes and the cat all need the same two numbers — the track's
 * real size, and each memory's position as a fraction of it — and those numbers
 * move whenever an image finishes loading and pushes the page taller. A
 * ResizeObserver on the track catches all of it; a rAF gate means a burst of
 * images arriving costs one measurement, not twenty.
 */
export function useSpineGeometry(
  trackRef: RefObject<HTMLElement | null>,
  eventRefs: RefObject<(HTMLElement | null)[]>,
  count: number
) {
  const [geo, setGeo] = useState<SpineGeo>(EMPTY_GEO);
  const [nodeTs, setNodeTs] = useState<number[]>([]);
  /** Each memory's top in document space, so the scroll handler reads no layout. */
  const [tops, setTops] = useState<number[]>([]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || !count) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      // clientWidth/Height is the padding box, which is exactly what an
      // `absolute inset-0` child spans — so spine coordinates line up with it.
      const w = track.clientWidth;
      const h = track.clientHeight;
      if (!w || !h) return;
      const mobile = window.innerWidth < 640;

      setGeo((prev) =>
        prev.w === w && prev.h === h && prev.mobile === mobile ? prev : { w, h, mobile }
      );

      const docTop = track.getBoundingClientRect().top + window.scrollY;
      const els = eventRefs.current ?? [];
      const ts: number[] = [];
      const nextTops: number[] = [];
      for (let i = 0; i < count; i++) {
        const el = els[i];
        ts.push(el ? (el.offsetTop + NODE_CENTRE) / h : 0);
        nextTops.push(el ? docTop + el.offsetTop : Number.POSITIVE_INFINITY);
      }
      setTops((prev) =>
        prev.length === nextTops.length && prev.every((v, i) => v === nextTops[i])
          ? prev
          : nextTops
      );
      setNodeTs((prev) =>
        prev.length === ts.length && prev.every((v, i) => Math.abs(v - ts[i]) < 0.0005)
          ? prev
          : ts
      );
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    const ro = new ResizeObserver(schedule);
    ro.observe(track);
    window.addEventListener('resize', schedule);
    measure();

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [trackRef, eventRefs, count]);

  return { geo, nodeTs, tops };
}
