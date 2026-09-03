interface ProseflyNamespace {
  lotus?: {
    initSidebarScroll?: () => void;
    initTableOfContents?: () => void;
    initPageActions?: () => void;
    initThemeSwitches?: () => void;
    themeSwitchReady?: boolean;
    initSearchDialog?: () => void;
    searchDialogReady?: boolean;
    initDocSearch?: () => Promise<void>;
    docSearchReady?: boolean;
    appearanceInitial?: {
      accent: string;
      gray: string;
      radius: string;
      accentLight: string;
      accentDark: string;
    };
    initAppearancePalette?: () => void;
    initMobileDocsNav?: () => void;
    initDropdowns?: () => void;
    initInkeepAssistant?: () => Promise<void>;
    inkeepAssistantReady?: boolean;
  };
}

interface Window {
  __prosefly?: ProseflyNamespace;
  docsearch?: (props: DocSearchProps) => DocSearchInstance;
}

interface DocSearchInstance {
  open(): void;
}

interface DocSearchProps {
  container: HTMLElement;
  appId: string;
  apiKey: string;
  indexName: string;
  askAi?: string;
  disableUserPersonalization?: boolean;
  insights?: boolean;
  maxResultsPerGroup?: number;
  placeholder?: string;
  searchParameters?: Record<string, unknown>;
  keyboardShortcuts?: {
    'Ctrl/Cmd+K'?: boolean;
    '/'?: boolean;
  };
}

interface Window {
  Inkeep?: {
    ModalSearchAndChat(settings: InkeepSettings): unknown;
  };
}

interface InkeepSettings {
  defaultView?: string;
  baseSettings: Record<string, unknown>;
  modalSettings?: Record<string, unknown>;
  searchSettings?: Record<string, unknown>;
  aiChatSettings?: Record<string, unknown>;
}
