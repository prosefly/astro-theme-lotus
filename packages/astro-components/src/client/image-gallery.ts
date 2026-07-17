declare global {
  interface Window {
    __proseflyImageGalleryInit?: () => void;
  }
}

export {};

type GalleryDirection = 'previous' | 'next';

function imageReady(image: HTMLImageElement): Promise<void> {
  if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    image.addEventListener('load', () => resolve(), { once: true });
    image.addEventListener('error', () => resolve(), { once: true });
  });
}

function resolveCssLength(value: string, context: Element): number {
  const trimmed = value.trim();

  if (!trimmed) {
    return 0;
  }

  const probe = document.createElement('div');
  probe.style.contain = 'strict';
  probe.style.height = '0';
  probe.style.overflow = 'hidden';
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.width = trimmed;
  context.append(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
}

function getItemLeft(track: HTMLElement, item: HTMLElement): number {
  return item.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
}

function scrollToAdjacentItem(track: HTMLElement, direction: GalleryDirection): void {
  const items = [...track.querySelectorAll('.pl-image-gallery__item')].filter(
    (item): item is HTMLElement => item instanceof HTMLElement,
  );
  const currentLeft = track.scrollLeft;
  const positions = items.map((item) => getItemLeft(track, item));
  const target =
    direction === 'previous'
      ? positions.findLast((left) => left < currentLeft - 2)
      : positions.find((left) => left > currentLeft + 2);

  track.scrollTo({
    behavior: 'smooth',
    left: target ?? (direction === 'previous' ? 0 : track.scrollWidth - track.clientWidth),
  });
}

function measureGallery(gallery: HTMLElement, track: HTMLElement): void {
  const items = [...track.querySelectorAll('.pl-image-gallery__item')].filter(
    (item): item is HTMLElement => item instanceof HTMLElement,
  );
  const images = items
    .map((item) => item.querySelector('img'))
    .filter((image): image is HTMLImageElement => image instanceof HTMLImageElement);

  if (items.length === 0 || items.length !== images.length || track.clientWidth <= 0) {
    return;
  }

  const ratios = images.map((image) =>
    image.naturalWidth > 0 && image.naturalHeight > 0
      ? image.naturalWidth / image.naturalHeight
      : undefined,
  );

  if (ratios.some((ratio) => !ratio)) {
    return;
  }

  const resolvedRatios = ratios as number[];
  const styles = getComputedStyle(track);
  const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
  const previewWidth = resolveCssLength(
    getComputedStyle(gallery).getPropertyValue('--pl-image-gallery-preview-width'),
    gallery,
  );
  const firstRatio = resolvedRatios[0];
  const targetHeight = Math.max((track.clientWidth - previewWidth - gap) / firstRatio, 1);

  gallery.style.setProperty('--pl-image-gallery-height', `${targetHeight.toFixed(2)}px`);
  gallery.dataset.plImageGalleryMeasured = 'true';

  items.forEach((item, index) => {
    const ratio = resolvedRatios[index];

    item.style.setProperty('--pl-image-gallery-ratio', ratio.toFixed(5));
    item.style.height = `${targetHeight.toFixed(2)}px`;
    item.style.width = `${Math.max(targetHeight * ratio, 1).toFixed(2)}px`;
  });
}

if (typeof window !== 'undefined') {
  if (!window.__proseflyImageGalleryInit) {
    window.__proseflyImageGalleryInit = () => {
      document.querySelectorAll('[data-pl-image-gallery]').forEach((gallery) => {
        if (!(gallery instanceof HTMLElement) || gallery.dataset.plImageGalleryReady) {
          return;
        }

        const track = gallery.querySelector<HTMLElement>('[data-pl-image-gallery-track]');

        if (!(track instanceof HTMLElement)) {
          return;
        }

        gallery.dataset.plImageGalleryReady = 'true';
        const measure = () => measureGallery(gallery, track);
        const images = [...track.querySelectorAll('img')].filter(
          (image): image is HTMLImageElement => image instanceof HTMLImageElement,
        );

        Promise.all(images.map(imageReady)).then(measure);
        new ResizeObserver(measure).observe(track);

        gallery.querySelectorAll('[data-pl-image-gallery-button]').forEach((button) => {
          if (!(button instanceof HTMLButtonElement)) {
            return;
          }

          button.addEventListener('click', () => {
            const direction = button.getAttribute('data-pl-image-gallery-button');

            scrollToAdjacentItem(track, direction === 'previous' ? 'previous' : 'next');
          });
        });
      });
    };

    document.addEventListener('astro:page-load', window.__proseflyImageGalleryInit);
  }

  window.__proseflyImageGalleryInit();
}
