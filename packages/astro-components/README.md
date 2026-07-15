# @prosefly/astro-components

Reusable Astro components for MDX content.

```astro
---
import { Callout } from '@prosefly/astro-components';
---

<Callout type="tip" title="Reusable">
  Package components use Prosefly CSS custom properties with built-in fallbacks.
</Callout>
```

## Styling

Consumers can theme the components with `--pl-*` custom properties:

- `--pl-text`
- `--pl-text-muted`
- `--pl-background`
- `--pl-surface`
- `--pl-accent`
- `--pl-accent-soft`
- `--pl-accent-contrast`
- `--pl-radius-sm`
- `--pl-radius-md`
- `--pl-radius-lg`
- `--pl-radius-full`
