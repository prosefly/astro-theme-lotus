export { defaultConfig } from './defaults';
export { resolveExpressiveCodeOptions } from './expressive-code';
export { resolveLlmsConfig } from './llms';
export { resolveMarkdownConfig } from './markdown';
export { defineLotusConfig } from './options';
export {
  loadLotusConfigFile,
  LOTUS_CONFIG_FILE,
  mergeLotusConfigOptions,
  normalizeDocsBasePath,
  resolveAsyncLotusConfig,
  resolveLocalAssetConfig,
  resolveLotusConfig,
} from './resolve';
export { lotusConfigPlugin } from './virtual';
export type { LlmsConfig, LlmsOption, ResolvedLlmsConfig } from './llms';
export type { LotusIntegrationOptions, LotusMarkdownOptions } from './options';
