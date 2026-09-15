/** Injetado em build-time pelo `define` do vite.config.ts. Não é segredo. */
declare const __NOTION_DATA_SOURCE_ID__: string

/**
 * Base da API do Notion vista pelo browser. Em dev é '/notion/v1' (proxy do
 * Vite); em produção é a URL do Worker da Cloudflare. Não é segredo.
 */
declare const __API_BASE__: string

/**
 * Base do proxy de foto. Em dev é '/foto' (middleware do Vite); em produção é a
 * rota /foto do Worker. Existe porque o S3 do Notion não manda CORS e uma foto
 * desenhada direto da origem dele contamina o canvas.
 */
declare const __FOTO_BASE__: string
