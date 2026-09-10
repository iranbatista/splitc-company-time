/** Injetado em build-time pelo `define` do vite.config.ts. Não é segredo. */
declare const __NOTION_DATA_SOURCE_ID__: string

/**
 * Base da API do Notion vista pelo browser. Em dev é '/notion/v1' (proxy do
 * Vite); em produção é a URL do Worker da Cloudflare. Não é segredo.
 */
declare const __API_BASE__: string
