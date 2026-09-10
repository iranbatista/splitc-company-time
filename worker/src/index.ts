/**
 * Proxy do Notion para o app de aniversários.
 *
 * O browser (GitHub Pages) fala com este Worker; o Worker injeta o
 * Authorization e encaminha para api.notion.com. O token vive só aqui,
 * como secret do Cloudflare, e nunca chega ao bundle.
 *
 * O Worker é deliberadamente burro e restrito: só duas rotas passam, e a
 * query só aceita o data source configurado. Sem isso, o proxy viraria uma
 * porta aberta para o workspace inteiro do Notion com o token da integração.
 */

export interface Env {
  /** Secret: wrangler secret put NOTION_TOKEN */
  NOTION_TOKEN: string
  /** Var: único data source que o proxy aceita consultar. */
  NOTION_DATA_SOURCE_ID: string
  /** Var: origens permitidas, separadas por vírgula. */
  ORIGENS_PERMITIDAS: string
}

const NOTION_BASE = 'https://api.notion.com'
const NOTION_VERSION = '2026-03-11'

/** UUID do Notion, com ou sem hífens. */
const UUID = '[0-9a-fA-F-]{32,36}'

function origemPermitida(origem: string | null, env: Env): string | null {
  if (!origem) return null
  const lista = env.ORIGENS_PERMITIDAS.split(',').map((o) => o.trim())
  return lista.includes(origem) ? origem : null
}

function headersCors(origem: string): Headers {
  return new Headers({
    'Access-Control-Allow-Origin': origem,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Notion-Version',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  })
}

function erro(status: number, mensagem: string, cors: Headers): Response {
  const headers = new Headers(cors)
  headers.set('Content-Type', 'application/json')
  return new Response(JSON.stringify({ message: mensagem }), { status, headers })
}

/** Só duas rotas passam. Qualquer outra coisa é 403. */
function rotaPermitida(metodo: string, caminho: string, env: Env): boolean {
  if (metodo === 'POST') {
    const query = new RegExp(
      `^/v1/data_sources/${env.NOTION_DATA_SOURCE_ID}/query$`,
    )
    return query.test(caminho)
  }
  if (metodo === 'GET') {
    return new RegExp(`^/v1/blocks/${UUID}/children$`).test(caminho)
  }
  return false
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origem = origemPermitida(request.headers.get('Origin'), env)
    if (!origem) {
      return new Response(JSON.stringify({ message: 'Origem não permitida.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const cors = headersCors(origem)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    const url = new URL(request.url)

    if (!rotaPermitida(request.method, url.pathname, env)) {
      return erro(403, 'Rota não permitida por este proxy.', cors)
    }

    if (!env.NOTION_TOKEN) {
      return erro(500, 'NOTION_TOKEN não configurado no Worker.', cors)
    }

    const alvo = new URL(url.pathname + url.search, NOTION_BASE)

    // Headers montados do zero: nada que o cliente mandou é repassado, então
    // ele não consegue sobrescrever Authorization nem Notion-Version.
    const upstream = await fetch(alvo, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: request.method === 'POST' ? await request.text() : undefined,
    })

    const headers = new Headers(cors)
    headers.set(
      'Content-Type',
      upstream.headers.get('Content-Type') ?? 'application/json',
    )
    // Retry-After precisa chegar ao cliente: o limiter do app usa isso no backoff.
    const retryAfter = upstream.headers.get('Retry-After')
    if (retryAfter) headers.set('Retry-After', retryAfter)
    headers.set('Access-Control-Expose-Headers', 'Retry-After')

    return new Response(upstream.body, { status: upstream.status, headers })
  },
} satisfies ExportedHandler<Env>
