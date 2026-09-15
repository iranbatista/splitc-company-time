import { carregarFonte, carregarImagem } from '@/lib/imagens/recursos'
import type { Modelo } from '@/lib/imagens/tipos'

/**
 * Cria o canvas no tamanho do modelo, garante que recursos e fontes estão
 * prontos e delega o desenho. Não conhece nenhuma arte.
 */
export async function gerarImagem<P>(modelo: Modelo<P>, params: P): Promise<Blob> {
  const motivo = modelo.aplicavel(params)
  if (motivo !== true) throw new Error(motivo)

  const [carregadas] = await Promise.all([
    Promise.all(
      modelo.imagens.map(async (url) => [url, await carregarImagem(url)] as const),
    ),
    // As fontes precisam estar prontas ANTES do primeiro fillText: o canvas não
    // re-renderiza quando a fonte chega depois.
    Promise.all(modelo.fontes.map(carregarFonte)),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = modelo.tamanho.largura
  canvas.height = modelo.tamanho.altura

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponível neste navegador.')

  modelo.desenhar(ctx, params, { imagens: new Map(carregadas) })

  const blob = await new Promise<Blob | null>((resolver) => {
    canvas.toBlob(resolver, 'image/png')
  })
  if (!blob) throw new Error('Não foi possível gerar o PNG.')

  return blob
}
