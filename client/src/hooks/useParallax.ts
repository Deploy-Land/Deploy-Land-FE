import { useEffect, useRef } from "react";

export interface ParallaxRefs {
  skyRef: React.RefObject<HTMLDivElement>;
  farRef: React.RefObject<HTMLDivElement>;
  midRef: React.RefObject<HTMLDivElement>;
  treesRef: React.RefObject<HTMLDivElement>;
  nearRef: React.RefObject<HTMLDivElement>;
}

export function useParallax() {
  const skyRef = useRef<HTMLDivElement>(null);
  const farRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const treesRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const speeds = {
      sky: 0.8,
      far: 1.2,
      mid: 2.4,
      trees: 4,
      near: 6,
    };

    const offsets = {
      sky: 0,
      far: 0,
      mid: 0,
      trees: 0,
      near: 0,
    } as Record<string, number>;

    const step = (t: number) => {
      const last = lastTimeRef.current ?? t;
      const dt = Math.min(0.05, (t - last) / 1000);
      lastTimeRef.current = t;

      const advance = (key: keyof typeof speeds, ref: React.RefObject<HTMLDivElement>) => {
        offsets[key] -= speeds[key] * (dt * 60);
        const wrapW = window.innerWidth;
        if (offsets[key] <= -wrapW) offsets[key] += wrapW;
        const x = Math.floor(offsets[key]);
        if (ref.current) {
          ref.current.style.backgroundPosition = `${x}px bottom`;
        }
      };

      advance("sky", skyRef);
      advance("far", farRef);
      advance("mid", midRef);
      advance("trees", treesRef);
      advance("near", nearRef);

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
    };
  }, []);

  return {
    skyRef,
    farRef,
    midRef,
    treesRef,
    nearRef,
  };
}