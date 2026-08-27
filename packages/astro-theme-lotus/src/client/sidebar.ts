const initializedSidebarContainers = new WeakSet<HTMLElement>();
let teardownLotusSidebarScroll: (() => void) | undefined;

function cleanupLotusSidebarScroll(): void {
  teardownLotusSidebarScroll?.();
  teardownLotusSidebarScroll = undefined;
}

function initLotusSidebarScroll(): void {
  cleanupLotusSidebarScroll();

  const controller = new AbortController();
  const containers = Array.from(document.querySelectorAll('[data-sidebar-scroll]'))
    .filter((container): container is HTMLElement => container instanceof HTMLElement);

  for (const container of containers) {
    if (initializedSidebarContainers.has(container)) {
      continue;
    }

    initializedSidebarContainers.add(container);
    container.dataset.sidebarReady = 'true';

    const scrollArea = container.querySelector<HTMLElement>('[data-sidebar-scroll-area]');
    const topFade = container.querySelector<HTMLElement>('[data-sidebar-fade-top]');
    const bottomFade = container.querySelector<HTMLElement>('[data-sidebar-fade-bottom]');

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

    scrollArea.addEventListener('scroll', updateFades, { passive: true, signal: controller.signal });
    window.addEventListener('resize', updateFades, { signal: controller.signal });
    updateFades();
  }

  teardownLotusSidebarScroll = () => {
    controller.abort();
    containers.forEach((container) => initializedSidebarContainers.delete(container));
  };
}

initLotusSidebarScroll();
document.addEventListener('astro:before-swap', cleanupLotusSidebarScroll);
document.addEventListener('astro:page-load', initLotusSidebarScroll);
