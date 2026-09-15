import type { Caixa } from '@/lib/imagens/tipos'

export const TAMANHO = { largura: 1200, altura: 627 }

export const MARGEM = 63

/**
 * Os tamanhos de fonte vieram do Canva (39,5 / 25 / 18) e as unidades de lá não
 * são os pixels desta arte. Este fator veio de medir a altura de caixa alta na
 * referência exportada — é estimativa, conferida contra
 * `docs/referencias/aniversario-casa.png` na página /preview.html.
 */
export const ESCALA_CANVA = 1200 / 875

export const LOGO: Caixa = { x: MARGEM, y: MARGEM, largura: 177, altura: 66 }

/**
 * O `y` sai de `627 - 63 - 475`. A spec original dizia "63 do topo", o que não
 * fecha com 475 de altura em 627 de canvas; a referência confirma 89. Manda
 * base + altura.
 */
export const SHAPE: Caixa = {
  x: TAMANHO.largura - MARGEM - 662,
  y: TAMANHO.altura - MARGEM - 475,
  largura: 662,
  altura: 475,
}

export const RAIO_SHAPE = 32
export const PADDING_SHAPE = 40
export const GAP_TITULO_CORPO = 20

/** Área útil dentro do shape, já descontado o padding. */
export const CONTEUDO = {
  x: SHAPE.x + PADDING_SHAPE,
  y: SHAPE.y + PADDING_SHAPE,
  largura: SHAPE.largura - PADDING_SHAPE * 2,
}

export const TITULO_1 = {
  tamanho: 39.5 * ESCALA_CANVA,
  entrelinha: 1.3,
  x: MARGEM,
  /** Base da última linha: o bloco cresce para cima a partir daqui. */
  base: TAMANHO.altura - MARGEM,
  /** Vai da margem esquerda até a borda do shape. */
  larguraMax: SHAPE.x - MARGEM,
}

export const TITULO_2 = {
  tamanho: 25 * ESCALA_CANVA,
  entrelinha: 1.3,
}

export const CORPO = {
  tamanho: 18 * ESCALA_CANVA,
  entrelinha: 1.5,
  cor: '#ffffff',
}

export function fonteTitulo1(): string {
  return `italic 400 ${TITULO_1.tamanho}px "DM Serif Display", serif`
}

export function fonteOutfit(tamanho: number, negrito: boolean): string {
  return `${negrito ? 700 : 400} ${tamanho}px "Outfit Variable", sans-serif`
}

/** Servidos de `public/`, então o base path do Vite entra na URL. */
export const URL_BACKGROUND = `${import.meta.env.BASE_URL}background.png`
export const URL_LOGO = `${import.meta.env.BASE_URL}logo.png`
