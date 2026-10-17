'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

type UniversityLogo = {
  name: string;
  src: string;
  href: string;
  width: number;
  height: number;
};

function subscribeToReducedMotion(onChange: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function HomeUniversityCarousel({ universities }: { universities: UniversityLogo[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const directionRef = useRef(1);
  const [touching, setTouching] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotion,
    () => true
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (touching || hovered || focused || reducedMotion || !visible) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    let frame: number;
    let previousTime: number | undefined;
    let position = viewport.scrollLeft;
    let maximum = 0;

    const measure = () => {
      maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      position = Math.min(viewport.scrollLeft, maximum);
      if (viewport.scrollLeft > maximum) viewport.scrollLeft = maximum;
      if (position >= maximum) directionRef.current = -1;
      else if (position <= 0) directionRef.current = 1;
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewport);
    const logos = viewport.firstElementChild;
    if (logos) resizeObserver.observe(logos);

    function animate(time: number) {
      const elapsed = previousTime === undefined ? 0 : Math.min(time - previousTime, 64);
      previousTime = time;
      if (maximum > 1) {
        position = Math.max(
          0,
          Math.min(maximum, position + (elapsed / 1000) * 36 * directionRef.current)
        );
        viewport!.scrollLeft = position;
        if (position >= maximum) directionRef.current = -1;
        else if (position <= 0) directionRef.current = 1;
      }
      frame = window.requestAnimationFrame(animate);
    }

    frame = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [touching, hovered, focused, reducedMotion, visible]);

  return (
    <div
      className="university-carousel"
      role="group"
      aria-roledescription="carrusel"
      aria-label="Universidades"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDownCapture={() => setFocused(false)}
      onKeyDownCapture={() => setFocused(true)}
      onFocusCapture={(event) => setFocused(event.target.matches(':focus-visible'))}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      onTouchStart={() => setTouching(true)}
      onTouchEnd={() => setTouching(false)}
      onTouchCancel={() => setTouching(false)}
    >
      <div
        ref={viewportRef}
        className="university-viewport"
        role="group"
        aria-label="Logos de universidades; deslizá para ver más"
        tabIndex={0}
      >
        <ul className="university-logos">
          {universities.map((university) => (
            <li key={university.src}>
              <a href={university.href} target="_blank" rel="noopener noreferrer">
                <Image
                  src={`/universidades/${university.src}`}
                  alt={`${university.name} — sitio oficial (abre en otra pestaña)`}
                  width={university.width}
                  height={university.height}
                  unoptimized
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
