import { useEffect } from 'react';

type RevealOnScrollOptions = {
  rootMargin?: string;
  selector?: string;
  threshold?: number;
  visibleClass?: string;
};

export function useRevealOnScroll({
  rootMargin = '0px 0px -10% 0px',
  selector = '[data-reveal]',
  threshold = 0.15,
  visibleClass = 'is-visible',
}: RevealOnScrollOptions = {}) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (!elements.length) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add(visibleClass));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(visibleClass);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin, threshold },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [rootMargin, selector, threshold, visibleClass]);
}
