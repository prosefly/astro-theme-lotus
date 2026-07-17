interface HeadingTarget {
  heading: HTMLElement;
  slug: string;
}

interface HeadingPosition {
  slug: string;
  top: number;
}

function parsePixels(value: string): number {
  const parsed = Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getChromeHeight(): number {
  const chromeHeight = getComputedStyle(document.documentElement)
    .getPropertyValue('--lotus-docs-chrome-height')
    .trim();
  const parsedChromeHeight = parsePixels(chromeHeight);

  return parsedChromeHeight || 112;
}

function initTableOfContents(): void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-toc-link]'));

  if (!links.length) {
    return;
  }

  const headingsBySlug = new Map<string, HeadingTarget>();

  links.forEach((link) => {
    const slug = link.getAttribute('data-toc-link');
    const heading = slug ? document.getElementById(slug) : null;

    if (slug && heading && !headingsBySlug.has(slug)) {
      headingsBySlug.set(slug, { heading, slug });
    }
  });

  const headings = Array.from(headingsBySlug.values());

  if (!headings.length) {
    return;
  }

  const tocLists = Array.from(document.querySelectorAll('[data-toc-list]'));
  let ticking = false;
  let headingPositions: HeadingPosition[] = [];

  const setActiveLink = (activeSlug?: string) => {
    links.forEach((link) => {
      if (link.getAttribute('data-toc-link') === activeSlug) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    tocLists.forEach((list) => {
      const indicator = list.querySelector<HTMLElement>('.lotus-toc-indicator');
      const listLinks = Array.from(list.querySelectorAll<HTMLAnchorElement>('a[data-toc-link]'));
      const activeLink = activeSlug
        ? listLinks.find((link) => link.getAttribute('data-toc-link') === activeSlug)
        : null;

      if (!indicator) {
        return;
      }

      if (!activeLink) {
        indicator.removeAttribute('data-visible');
        return;
      }

      indicator.style.height = `${activeLink.offsetHeight}px`;
      indicator.style.transform = `translateY(${activeLink.offsetTop}px)`;
      indicator.setAttribute('data-visible', '');
    });
  };

  const getActivationOffset = () => {
    const firstHeading = headings[0]?.heading;

    if (!firstHeading) {
      return getChromeHeight() + 24;
    }

    const scrollMarginTop = parsePixels(getComputedStyle(firstHeading).scrollMarginTop);

    return Math.max(scrollMarginTop + 1, getChromeHeight() + 24);
  };

  const measureHeadings = () => {
    headingPositions = headings
      .map(({ heading, slug }) => ({
        slug,
        top: heading.getBoundingClientRect().top + window.scrollY,
      }))
      .sort((left, right) => left.top - right.top);
  };

  const getActiveSlug = () => {
    if (!headingPositions.length) {
      measureHeadings();
    }

    const currentPosition = window.scrollY + getActivationOffset();
    let activeSlug: string | undefined;

    for (const position of headingPositions) {
      if (position.top <= currentPosition) {
        activeSlug = position.slug;
      } else {
        break;
      }
    }

    return activeSlug;
  };

  const updateActiveLink = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(() => {
      setActiveLink(getActiveSlug());
      ticking = false;
    });
  };

  links.forEach((link) => {
    link.addEventListener('click', () => {
      const slug = link.getAttribute('data-toc-link');

      if (slug) {
        setActiveLink(slug);
      }
    });
  });

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  window.addEventListener('resize', () => {
    measureHeadings();
    updateActiveLink();
  });
  window.addEventListener('load', () => {
    measureHeadings();
    updateActiveLink();
  });
  document.querySelectorAll('[data-lotus-mobile-toc-menu]').forEach((menu) => {
    menu.addEventListener('toggle', updateActiveLink);
  });
  measureHeadings();
  setActiveLink(getActiveSlug());
}

initTableOfContents();
