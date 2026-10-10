import components, {
  COMPONENTS_INTEGRATION_NAME,
} from '@prosefly/astro-components/integration';
import type { AstroIntegration } from 'astro';

export function getDefaultComponentsIntegration(
  integrations: readonly AstroIntegration[],
): AstroIntegration | undefined {
  const isRegistered = integrations.some(
    (integration) => integration.name === COMPONENTS_INTEGRATION_NAME,
  );

  return isRegistered ? undefined : components();
}
