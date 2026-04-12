'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';

export default function LenisWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth easing
      // orientation: 'vertical',
      // gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      // smoothTouch: false,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
