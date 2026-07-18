let lotusDropdownContentId = 0;

function initLotusDropdowns(): void {
  document.querySelectorAll('[data-lotus-dropdown]').forEach((details) => {
    if (!(details instanceof HTMLDetailsElement) || details.dataset.lotusDropdownReady) {
      return;
    }

    details.dataset.lotusDropdownReady = 'true';
    const summary = details.querySelector('summary');
    const content = details.querySelector<HTMLElement>('[data-lotus-dropdown-content]');

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

    syncExpanded();

    details.addEventListener('toggle', () => {
      syncExpanded();

      if (!details.open) {
        return;
      }

      document.querySelectorAll('[data-lotus-dropdown][open]').forEach((otherDetails) => {
        if (otherDetails !== details && otherDetails instanceof HTMLDetailsElement) {
          otherDetails.open = false;
        }
      });
    });

    document.addEventListener('click', (event) => {
      if (!details.open || !(event.target instanceof Node) || details.contains(event.target)) {
        return;
      }

      details.open = false;
    });

    details.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      details.open = false;
      details.querySelector('summary')?.focus();
    });

    details.querySelectorAll('[data-lotus-dropdown-close]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        details.open = false;
      });
    });
  });
}

initLotusDropdowns();
document.addEventListener('astro:page-load', initLotusDropdowns);
