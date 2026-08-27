const initializedDropdowns = new WeakSet<HTMLDetailsElement>();
let lotusDropdownContentId = 0;
let teardownLotusDropdowns: (() => void) | undefined;

function cleanupLotusDropdowns(): void {
  teardownLotusDropdowns?.();
  teardownLotusDropdowns = undefined;
}

function initLotusDropdowns(): void {
  cleanupLotusDropdowns();

  const controller = new AbortController();
  const detailsElements = Array.from(document.querySelectorAll('[data-dropdown]'))
    .filter((details): details is HTMLDetailsElement => details instanceof HTMLDetailsElement);

  detailsElements.forEach((details) => {
    if (initializedDropdowns.has(details)) {
      return;
    }

    initializedDropdowns.add(details);
    details.dataset.dropdownReady = 'true';
    const summary = details.querySelector('summary');
    const content = details.querySelector<HTMLElement>('[data-dropdown-content]');

    if (summary && content) {
      if (!content.id) {
        lotusDropdownContentId += 1;
        content.id = `lotus-dropdown-content-${lotusDropdownContentId}`;
      }

      summary.setAttribute('aria-controls', content.id);
    }

    const syncExpanded = () => {
      summary?.setAttribute('aria-expanded', String(details.open));
    };

    const handleToggle = () => {
      syncExpanded();

      if (!details.open) {
        return;
      }

      document.querySelectorAll('[data-dropdown][open]').forEach((otherDetails) => {
        if (otherDetails !== details && otherDetails instanceof HTMLDetailsElement) {
          otherDetails.open = false;
        }
      });
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (!details.open || !(event.target instanceof Node) || details.contains(event.target)) {
        return;
      }

      details.open = false;
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      details.open = false;
      details.querySelector('summary')?.focus();
    };

    const handleClose = () => {
      details.open = false;
    };

    syncExpanded();
    details.addEventListener('toggle', handleToggle, { signal: controller.signal });
    document.addEventListener('click', handleDocumentClick, { signal: controller.signal });
    details.addEventListener('keydown', handleKeydown, { signal: controller.signal });
    details.querySelectorAll('[data-dropdown-close]').forEach((trigger) => {
      trigger.addEventListener('click', handleClose, { signal: controller.signal });
    });
  });

  teardownLotusDropdowns = () => {
    controller.abort();
    detailsElements.forEach((details) => initializedDropdowns.delete(details));
  };
}

initLotusDropdowns();
document.addEventListener('astro:before-swap', cleanupLotusDropdowns);
document.addEventListener('astro:page-load', initLotusDropdowns);
