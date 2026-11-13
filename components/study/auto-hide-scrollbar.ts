/**
 * Ref callback (React 19, con cleanup): la barra de scroll queda oculta y sólo
 * aparece mientras se desliza. Se usa junto con la clase `scroll-auto-hide`.
 */
export function autoHideScrollbarRef(element: HTMLElement | null) {
  if (!element) return;
  let timer: number | undefined;
  const onScroll = () => {
    element.dataset.scrolling = 'true';
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      delete element.dataset.scrolling;
    }, 900);
  };
  element.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    window.clearTimeout(timer);
    element.removeEventListener('scroll', onScroll);
    delete element.dataset.scrolling;
  };
}
