import axios, { AxiosError } from 'axios'
import type {
  NotionBlock,
  NotionBlockChildrenResponse,
  NotionPage,
  NotionQueryResponse,
} from '@/types/notion'
import { imageUrl, isImageBlock } from '@/types/notion'
import type { ErroApi, Pessoa } from '@/types/aniversariante'
import { parseDataNotion } from '@/lib/aniversario'

export const DATA_SOURCE_ID = __NOTION_DATA_SOURCE_ID__

const NOTION_VERSION = '2026-03-11'

/**
 * O browser nunca fala direto com api.notion.com — sempre com um proxy que
 * injeta o Authorization do lado do servidor. Em dev o proxy é o dev server do
 * Vite ('/notion/v1'); em produção é o Worker da Cloudflare (worker/src/index.ts).
 * Nos dois casos o token não chega ao bundle.
 */
const http = axios.create({
  baseURL: __API_BASE__,
  headers: {
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  },
})

/* ------------------------------------------------------------------ */
/* Rate limit: ~3 req/s. Concorrência 3 + intervalo mínimo entre starts. */
/* ------------------------------------------------------------------ */

function criarLimiter(maxConcorrente: number, gapMinimoMs: number) {
  let ativos = 0
  let ultimoStart = 0
  const fila: Array<() => void> = []

  function tentar(): void {
    if (fila.length === 0 || ativos >= maxConcorrente) return
    const espera = ultimoStart + gapMinimoMs - Date.now()
    if (espera > 0) {
      setTimeout(tentar, espera)
      return
    }
    const proximo = fila.shift()
    if (!proximo) return
    ativos += 1
    ultimoStart = Date.now()
    proximo()
  }

  return async function agendar<T>(tarefa: () => Promise<T>): Promise<T> {
    await new Promise<void>((resolve) => {
      fila.push(resolve)
      tentar()
    })
    try {
      return await tarefa()
    } finally {
      ativos -= 1
      tentar()
    }
  }
}

/** ~3 req/s: no máximo 3 em voo e um start a cada 340ms. */
const limiter = criarLimiter(3, 340)

function dormir(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const STATUS_RETENTAVEIS = new Set([429, 502, 503, 504])

/** Executa via limiter, com retry + backoff exponencial em 429/503. */
async function comRetry<T>(tarefa: () => Promise<T>, tentativas = 4): Promise<T> {
  let ultimoErro: unknown
  for (let tentativa = 0; tentativa < tentativas; tentativa += 1) {
    try {
      return await limiter(tarefa)
    } catch (erro) {
      ultimoErro = erro
      const status = axios.isAxiosError(erro) ? erro.response?.status : undefined
      if (status === undefined || !STATUS_RETENTAVEIS.has(status)) throw erro
      if (tentativa === tentativas - 1) break

      const retryAfter = axios.isAxiosError(erro)
        ? Number(erro.response?.headers['retry-after'])
        : NaN
      const backoff = Number.isFinite(retryAfter)
        ? retryAfter * 1000
        : 500 * 2 ** tentativa
      await dormir(backoff)
    }
  }
  throw ultimoErro
}

/* ------------------------------------------------------------------ */
/* Lista de pessoas                                                     */
/* ------------------------------------------------------------------ */

interface FiltroQuery {
  and: Array<
    | { property: 'Status'; select: { equals: string } }
    | { property: 'Quando entrou na empresa?'; date: { is_not_empty: true } }
  >
}

const FILTRO: FiltroQuery = {
  and: [
    { property: 'Status', select: { equals: 'Ativo' } },
    { property: 'Quando entrou na empresa?', date: { is_not_empty: true } },
  ],
}

/** Pagina o data source até o fim usando has_more / next_cursor. */
async function buscarTodasAsPaginas(): Promise<NotionPage[]> {
  const todas: NotionPage[] = []
  let cursor: string | null = null

  do {
    const body: Record<string, unknown> = {
      filter: FILTRO,
      page_size: 100,
    }
    if (cursor) body.start_cursor = cursor

    const { data } = await comRetry(() =>
      http.post<NotionQueryResponse>(
        `/data_sources/${DATA_SOURCE_ID}/query`,
        body,
      ),
    )

    todas.push(...data.results)
    cursor = data.has_more ? data.next_cursor : null
  } while (cursor)

  return todas
}

function paraPessoa(page: NotionPage): Pessoa | null {
  const props = page.properties

  const inicio = props['Quando entrou na empresa?']?.date?.start
  if (!inicio) return null

  const admissao = parseDataNotion(inicio)
  if (!admissao) return null

  const nome =
    props.Nome?.title.map((t) => t.plain_text).join('').trim() || 'Sem nome'

  return {
    id: page.id,
    nome,
    email: props['E-mail']?.email ?? null,
    setores: props.Setor?.multi_select.map((opcao) => opcao.name) ?? [],
    admissao,
  }
}

/**
 * Todas as pessoas ativas com data de admissão. Sem recorte de mês: o filtro
 * do Notion não sabe filtrar por mês, então a query é a mesma para qualquer
 * mês de referência e o recorte acontece no cliente (`aniversariantesDoMes`).
 */
export async function buscarPessoas(): Promise<Pessoa[]> {
  const pages = await buscarTodasAsPaginas()
  return pages
    .map(paraPessoa)
    .filter((pessoa): pessoa is Pessoa => pessoa !== null)
}

/* ------------------------------------------------------------------ */
/* Foto: primeiro bloco image no corpo da página                        */
/* ------------------------------------------------------------------ */

const PROFUNDIDADE_MAXIMA = 3

async function filhos(blockId: string): Promise<NotionBlock[]> {
  const { data } = await comRetry(() =>
    http.get<NotionBlockChildrenResponse>(`/blocks/${blockId}/children`, {
      params: { page_size: 100 },
    }),
  )
  return data.results
}

/**
 * Retorna a URL do primeiro bloco `image` encontrado, descendo em blocos com
 * has_children (coluna, callout, toggle...). URL de `file` é assinada e expira
 * em ~1h; `external` é permanente.
 */
export async function buscarFoto(
  blockId: string,
  profundidade = 0,
): Promise<string | null> {
  if (profundidade >= PROFUNDIDADE_MAXIMA) return null

  const blocos = await filhos(blockId)

  for (const bloco of blocos) {
    if (isImageBlock(bloco)) return imageUrl(bloco.image)
  }

  for (const bloco of blocos) {
    if (!bloco.has_children) continue
    const url = await buscarFoto(bloco.id, profundidade + 1)
    if (url) return url
  }

  return null
}

/* ------------------------------------------------------------------ */
/* Erros                                                                */
/* ------------------------------------------------------------------ */

export function classificarErro(erro: unknown): ErroApi {
  if (!DATA_SOURCE_ID) {
    return {
      tipo: 'sem-config',
      mensagem:
        'NOTION_DATA_SOURCE_ID não configurado. Em dev: copie .env.example para .env, preencha e reinicie o dev server. Em produção: defina a variable NOTION_DATA_SOURCE_ID no repositório.',
    }
  }

  if (axios.isAxiosError(erro)) {
    const axiosErro = erro as AxiosError<{ message?: string; code?: string }>
    const status = axiosErro.response?.status

    if (status === 404) {
      return {
        tipo: 'nao-compartilhado',
        status,
        mensagem:
          'O Notion respondeu 404. Provavelmente a integração não foi compartilhada com o database (abra a página no Notion, menu de opções, Connections, adicione a integração), ou o data source id está errado.',
      }
    }

    if (status === 401 || status === 403) {
      return {
        tipo: 'outro',
        status,
        mensagem: `Notion respondeu ${status}: token inválido ou sem permissão. Em dev, confira NOTION_TOKEN no .env e reinicie o dev server. Em produção, confira o secret NOTION_TOKEN do Worker.`,
      }
    }

    return {
      tipo: 'outro',
      status,
      mensagem:
        axiosErro.response?.data?.message ??
        axiosErro.message ??
        'Falha ao falar com a API do Notion.',
    }
  }

  return {
    tipo: 'outro',
    mensagem: erro instanceof Error ? erro.message : 'Erro desconhecido.',
  }
}
