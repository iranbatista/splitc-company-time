import { carregarFonte, carregarImagem } from '@/lib/imagens/recursos'
import type { Modelo } from '@/lib/imagens/tipos'

/**
 * Cria o canvas no tamanho do modelo, garante que recursos e fontes estão
 * prontos e delega o desenho. Não conhece nenhuma arte.
 */
export async function gerarImagem<P>(modelo: Modelo<P>, params: P): Promise<Blob> {
  const motivo = modelo.aplicavel(params)
  if (motivo !== true) throw new Error(motivo)

  const urls = modelo.imagens(params)
  const [resultados] = await Promise.all([
    // allSettled, e não all: uma foto que falha não pode derrubar a imagem
    // inteira. O que é obrigatório, a arte cobra ao desenhar.
    Promise.allSettled(urls.map((url) => carregarImagem(url))),
    // As fontes precisam estar prontas ANTES do primeiro fillText: o canvas não
    // re-renderiza quando a fonte chega depois.
    Promise.all(modelo.fontes.map(carregarFonte)),
  ])

  const carregadas = new Map<string, HTMLImageElement>()
  resultados.forEach((resultado, i) => {
    if (resultado.status === 'fulfilled') carregadas.set(urls[i], resultado.value)
    else console.warn(`[imagens] não carregou ${urls[i]}`, resultado.reason)
  })

  const canvas = document.createElement('canvas')
  canvas.width = modelo.tamanho.largura
  canvas.height = modelo.tamanho.altura

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponível neste navegador.')

  modelo.desenhar(ctx, params, { imagens: carregadas })

  const blob = await new Promise<Blob | null>((resolver) => {
    canvas.toBlob(resolver, 'image/png')
  })
  if (!blob) throw new Error('Não foi possível gerar o PNG.')

  return blob
}
