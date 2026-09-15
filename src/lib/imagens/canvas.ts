import type { Caixa, Linha } from '@/lib/imagens/tipos'

/** Stops da marca, na ordem do gradiente. */
const STOPS_MARCA: readonly [number, string][] = [
  [0, '#f7a205'],
  [0.5, '#f07f16'],
  [1, '#ea5518'],
]

export interface Recorte {
  sx: number
  sy: number
  sw: number
  sh: number
}

/**
 * Região da imagem de origem que preenche o destino sem distorcer, centrada —
 * o mesmo que `object-fit: cover`.
 */
export function recorteCover(
  origem: { largura: number; altura: number },
  destino: { largura: number; altura: number },
): Recorte {
  const escala = Math.max(destino.largura / origem.largura, destino.altura / origem.altura)
  const sw = destino.largura / escala
  const sh = destino.altura / escala
  return {
    sx: (origem.largura - sw) / 2,
    sy: (origem.altura - sh) / 2,
    sw,
    sh,
  }
}

export function coverEm(ctx: CanvasRenderingContext2D, img: HTMLImageElement, caixa: Caixa): void {
  const { sx, sy, sw, sh } = recorteCover(
    { largura: img.naturalWidth, altura: img.naturalHeight },
    caixa,
  )
  ctx.drawImage(img, sx, sy, sw, sh, caixa.x, caixa.y, caixa.largura, caixa.altura)
}

/** Abre o caminho do retângulo arredondado. Quem chama decide entre `clip()` e `fill()`. */
export function caixaArredondada(ctx: CanvasRenderingContext2D, caixa: Caixa, raio: number): void {
  ctx.beginPath()
  ctx.roundRect(caixa.x, caixa.y, caixa.largura, caixa.altura, raio)
}

/**
 * Gradiente da marca no eixo do canto superior esquerdo ao inferior direito da
 * caixa. É a leitura do `linear-gradient(135deg, ...)` do CSS aplicada à caixa
 * do próprio texto, e não à imagem inteira: é assim que o Canva desenha.
 */
export function gradiente135(ctx: CanvasRenderingContext2D, caixa: Caixa): CanvasGradient {
  const gradiente = ctx.createLinearGradient(
    caixa.x,
    caixa.y,
    caixa.x + caixa.largura,
    caixa.y + caixa.altura,
  )
  for (const [posicao, cor] of STOPS_MARCA) {
    gradiente.addColorStop(posicao, cor)
  }
  return gradiente
}

/**
 * Desenha linhas já quebradas. `fillStyle` é responsabilidade de quem chama —
 * é o que permite a mesma função servir ao texto branco e ao com gradiente.
 */
export function desenharLinhas(
  ctx: CanvasRenderingContext2D,
  linhas: Linha[],
  x: number,
  yInicial: number,
  entrelinha: number,
  fonte: (negrito: boolean) => string,
): void {
  linhas.forEach((linha, indice) => {
    const y = yInicial + indice * entrelinha
    let cursor = x
    for (const trecho of linha) {
      ctx.font = fonte(trecho.negrito)
      ctx.fillText(trecho.texto, cursor, y)
      cursor += ctx.measureText(trecho.texto).width
    }
  })
}

/** Largura da linha mais larga, para dimensionar a caixa do gradiente. */
export function larguraMaxima(
  ctx: CanvasRenderingContext2D,
  linhas: Linha[],
  fonte: (negrito: boolean) => string,
): number {
  let maior = 0
  for (const linha of linhas) {
    let soma = 0
    for (const trecho of linha) {
      ctx.font = fonte(trecho.negrito)
      soma += ctx.measureText(trecho.texto).width
    }
    maior = Math.max(maior, soma)
  }
  return maior
}
