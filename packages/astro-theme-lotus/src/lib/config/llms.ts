import type { LotusThemeConfig } from '../theme';

export interface LlmsConfig {
  full?: boolean;
}

export type LlmsOption = boolean | LlmsConfig;

export interface ResolvedLlmsConfig {
  enabled: boolean;
  full: boolean;
}

export function resolveLlmsConfig(config: LotusThemeConfig): ResolvedLlmsConfig {
  if (config.llms === false) {
    return {
      enabled: false,
      full: false,
    };
  }

  return {
    enabled: true,
    full: typeof config.llms === 'object' && config.llms.full === true,
  };
}
