import { describe, expect, it } from 'vitest';
import type { AstroIntegration } from 'astro';
import { getDefaultComponentsIntegration } from '../src/lib/config/components-integration';

function integration(name: string): AstroIntegration {
  return { name, hooks: {} };
}

describe('Lotus integration setup', () => {
  it('does not add Astro Components when the user registered it', () => {
    expect(getDefaultComponentsIntegration([
      integration('@prosefly/astro-components'),
      integration('@prosefly/astro-theme-lotus'),
    ])).toBeUndefined();
  });

  it('adds default Astro Components when the user did not register it', () => {
    expect(getDefaultComponentsIntegration([
      integration('@prosefly/astro-theme-lotus'),
    ])?.name).toBe('@prosefly/astro-components');
  });
});
