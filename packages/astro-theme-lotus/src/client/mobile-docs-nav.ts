function initMobileDocsNav(): void {
  const drawer = document.querySelector<HTMLElement>('[data-lotus-mobile-sidebar]');
  const openButtons = Array.from(document.querySelectorAll('[data-lotus-mobile-sidebar-open]'));
  const closeButtons = drawer
    ? Array.from(drawer.querySelectorAll('[data-lotus-mobile-sidebar-close]'))
    : [];
  const tocMenu = document.querySelector<HTMLDetailsElement>('[data-lotus-mobile-toc-menu]');
  const sectionSwitch = document.querySelector<HTMLDetailsElement>('[data-lotus-section-switch]');
  const sectionOptions = Array.from(document.querySelectorAll<HTMLElement>('[data-lotus-section-option]'));
  const sectionPanels = Array.from(document.querySelectorAll<HTMLElement>('[data-lotus-section-panel]'));
  const summaryLabel = document.querySelector('[data-lotus-section-summary-label]');
  const summaryCount = document.querySelector('[data-lotus-section-summary-count]');
  const summaryIcons = Array.from(document.querySelectorAll<HTMLElement>('[data-lotus-section-summary-icon]'));

  if (!drawer || !openButtons.length || drawer.dataset.lotusMobileDocsNavReady) {
    return;
  }

  drawer.dataset.lotusMobileDocsNavReady = 'true';

  let closeTimer: number | undefined;
  let previousOverflow = '';
  let previousFocus: HTMLElement | null = null;

  const openDrawer = () => {
    window.clearTimeout(closeTimer);
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    drawer.hidden = false;
    drawer.removeAttribute('inert');
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    window.requestAnimationFrame(() => {
      drawer.setAttribute('data-open', '');
    });
  };

  const closeDrawer = () => {
    drawer.removeAttribute('data-open');
    document.documentElement.style.overflow = previousOverflow;
    previousFocus?.focus({ preventScroll: true });
    drawer.setAttribute('inert', '');
    closeTimer = window.setTimeout(() => {
      drawer.hidden = true;
    }, 180);
  };

  openButtons.forEach((button) => {
    button.addEventListener('click', openDrawer);
  });

  closeButtons.forEach((button) => {
    button.addEventListener('click', closeDrawer);
  });

  drawer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });

  sectionOptions.forEach((option) => {
    option.addEventListener('click', () => {
      const slug = option.getAttribute('data-lotus-section-option');

      if (!slug) {
        return;
      }

      sectionOptions.forEach((item) => {
        const active = item.getAttribute('data-lotus-section-option') === slug;
        item.toggleAttribute('data-active', active);

        if (active) {
          item.setAttribute('aria-current', 'page');
        } else {
          item.removeAttribute('aria-current');
        }
      });

      sectionPanels.forEach((panel) => {
        panel.hidden = panel.getAttribute('data-lotus-section-panel') !== slug;
      });
      window.dispatchEvent(new Event('resize'));

      summaryIcons.forEach((icon) => {
        icon.hidden = icon.getAttribute('data-lotus-section-summary-icon') !== slug;
      });

      if (summaryLabel) {
        summaryLabel.textContent = option.getAttribute('data-lotus-section-label') ?? '';
      }

      if (summaryCount) {
        summaryCount.textContent = option.getAttribute('data-lotus-section-count') ?? '';
      }

      sectionSwitch?.removeAttribute('open');
    });
  });

  tocMenu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      tocMenu.removeAttribute('open');
    });
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDrawer();
      tocMenu?.removeAttribute('open');
    }
  });
}

initMobileDocsNav();
