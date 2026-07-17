function initLotusSidebarScroll(): void {
  const containers = Array.from(document.querySelectorAll('[data-lotus-sidebar-scroll]'));

  for (const container of containers) {
    if (!(container instanceof HTMLElement) || container.dataset.lotusSidebarReady) {
      continue;
    }

    container.dataset.lotusSidebarReady = 'true';

    const scrollArea = container.querySelector<HTMLElement>('[data-lotus-sidebar-scroll-area]');
    const topFade = container.querySelector<HTMLElement>('[data-lotus-sidebar-fade-top]');
    const bottomFade = container.querySelector<HTMLElement>('[data-lotus-sidebar-fade-bottom]');

    if (!scrollArea || !topFade || !bottomFade) {
      continue;
    }

    const updateFades = () => {
      const overflow = scrollArea.scrollHeight > scrollArea.clientHeight + 1;
      const atTop = scrollArea.scrollTop <= 1;
      const atBottom =
        scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 1;

      topFade.toggleAttribute('data-visible', overflow && !atTop);
      bottomFade.toggleAttribute('data-visible', overflow && !atBottom);
    };

    scrollArea.addEventListener('scroll', updateFades, { passive: true });
    window.addEventListener('resize', updateFades);
    updateFades();
  }
}

initLotusSidebarScroll();
document.addEventListener('astro:page-load', initLotusSidebarScroll);
