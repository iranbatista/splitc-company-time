/**
 * Proxy do Notion para o app de aniversários.
 *
 * O browser (GitHub Pages) fala com este Worker; o Worker injeta o
 * Authorization e encaminha para api.notion.com. O token vive só aqui,
 * como secret do Cloudflare, e nunca chega ao bundle.
 *
 * O Worker é deliberadamente burro e restrito: só três rotas passam, e a
 * query só aceita o data source configurado. Sem isso, o proxy viraria uma
 * porta aberta para o workspace inteiro do Notion com o token da integração.
 *
 * A terceira rota é /foto, que existe só por causa do canvas: o S3 do Notion
 * não manda header de CORS, então uma foto desenhada direto da origem dele
 * contamina o canvas e o `toBlob` passa a lançar. Buscar a foto aqui e devolver
 * com CORS resolve — e é justamente o tipo de rota que vira proxy aberto se
 * aceitar qualquer URL, então ela só aceita host da allowlist.
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

/** Só as rotas da API do Notion. /foto é tratada à parte. */
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

/**
 * Hosts de onde uma foto pode vir. Lista fechada, comparada por igualdade: um
 * `endsWith` aceitaria `prod-files-secure.s3.us-west-2.amazonaws.com.mal.com`.
 * Foto hospedada fora do Notion (bloco image do tipo `external`) não passa, e o
 * app cai no placeholder de iniciais — melhor que liberar host arbitrário.
 */
const HOSTS_DE_FOTO = new Set([
  'prod-files-secure.s3.us-west-2.amazonaws.com',
  's3.us-west-2.amazonaws.com',
  'file.notion.so',
  'img.notionusercontent.com',
  'prod-files-secure.notion-static.com',
])

/** Teto de resposta, para o proxy não virar canal de transferência. */
const TAMANHO_MAXIMO_DA_FOTO = 12 * 1024 * 1024

async function servirFoto(url: URL, cors: Headers): Promise<Response> {
  const alvo = url.searchParams.get('url')
  if (!alvo) return erro(400, 'Falta o parâmetro url.', cors)

  let destino: URL
  try {
    destino = new URL(alvo)
  } catch {
    return erro(400, 'URL inválida.', cors)
  }

  if (destino.protocol !== 'https:') return erro(403, 'Só https.', cors)
  if (!HOSTS_DE_FOTO.has(destino.hostname)) {
    return erro(403, `Host não permitido: ${destino.hostname}.`, cors)
  }

  // `manual` de propósito: seguir redirect deixaria a allowlist de fora da
  // decisão, porque o destino final poderia ser qualquer host.
  const upstream = await fetch(destino.toString(), { redirect: 'manual' })

  if (upstream.status >= 300 && upstream.status < 400) {
    return erro(502, 'A origem respondeu com redirect, que não é seguido.', cors)
  }
  if (!upstream.ok) {
    return erro(upstream.status, 'A origem não devolveu a foto.', cors)
  }

  const tipo = upstream.headers.get('Content-Type') ?? ''
  if (!tipo.startsWith('image/')) {
    return erro(415, `A origem devolveu ${tipo || 'tipo desconhecido'}.`, cors)
  }

  const tamanho = Number(upstream.headers.get('Content-Length') ?? '0')
  if (tamanho > TAMANHO_MAXIMO_DA_FOTO) {
    return erro(413, 'Foto maior que o limite do proxy.', cors)
  }

  const headers = new Headers(cors)
  headers.set('Content-Type', tipo)
  // A URL do Notion é assinada e expira; cache curto, e só no browser.
  headers.set('Cache-Control', 'private, max-age=300')
  return new Response(upstream.body, { status: 200, headers })
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

    if (request.method === 'GET' && url.pathname === '/foto') {
      return servirFoto(url, cors)
    }

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
