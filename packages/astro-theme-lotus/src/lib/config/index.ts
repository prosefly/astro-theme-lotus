export { defaultConfig } from './defaults';
export { resolveExpressiveCodeOptions } from './expressive-code';
export { resolveLlmsConfig } from './llms';
export { resolveMarkdownConfig } from './markdown';
export { defineLotusConfig } from './options';
export {
  normalizeDocsBasePath,
  resolveLocalAssetConfig,
  resolveLotusConfig,
} from './resolve';
export { lotusConfigPlugin } from './virtual';
export type { LlmsConfig, LlmsOption, ResolvedLlmsConfig } from './llms';
export type { LotusIntegrationOptions, LotusMarkdownOptions } from './options';
