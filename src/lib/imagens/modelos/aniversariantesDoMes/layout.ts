export const TAMANHO = { largura: 1920, altura: 1080 }

export const MARGEM_LATERAL = 108
export const MARGEM_TOPO = 100

/**
 * Mesma história da outra arte: os tamanhos vieram do Canva e as unidades de lá
 * não são os pixels desta peça. Este fator é estimativa medida no export e é
 * conferido em /preview.html?arte=mes.
 */
export const ESCALA_CANVA = 1.33

/** O fundo tem exatamente o tamanho da arte, então é desenho 1:1. */
export const URL_BACKGROUND = `${import.meta.env.BASE_URL}background-2.png`
export const URL_LOGO = `${import.meta.env.BASE_URL}logo-2.png`

export const LOGO = {
  largura: 200,
  altura: 75,
  x: TAMANHO.largura - MARGEM_LATERAL - 200,
  y: MARGEM_TOPO,
}

/**
 * Título e subtítulo são ancorados pela TINTA, com as coordenadas medidas no
 * export. A spec fala em 100 do topo e 108 da esquerda, mas isso é a caixa do
 * Canva: ela tem entrelinha acima da tinta e a lateral muda com o glifo (o "A"
 * em itálico avança para a esquerda). Ancorar pela tinta acerta os dois sem
 * depender de reproduzir a caixa do Canva.
 */
export const TITULO = {
  tamanho: 40 * ESCALA_CANVA,
  entrelinha: 1.2,
  tinta: { x: 114, y: 120 },
}

export const SUBTITULO = {
  tamanho: 16 * ESCALA_CANVA,
  entrelinha: 1.2,
  tinta: { x: 116, y: 185 },
  cor: '#ffffff',
}

export const CARD = {
  largura: 272,
  padding: 20,
  raio: 20,
  borda: 3,
  gap: 16,
}

export const FOTO = { largura: 230, altura: 170, raio: 12 }

export const NOME = { tamanho: 21 * ESCALA_CANVA, entrelinha: 1.3, cor: '#f87f06', gapAcima: 12 }
export const SETOR = { tamanho: 16 * ESCALA_CANVA, entrelinha: 1.3, cor: '#ffffff', gapAcima: 8 }
export const TEMPO = { tamanho: 16 * ESCALA_CANVA, entrelinha: 1.3, cor: '#ffffff', gapAcima: 8 }

/**
 * Faixa em que a grade é centralizada. O topo fica abaixo do cabeçalho e a base
 * é a borda da arte: com duas linhas, o bloco cai onde o export o coloca.
 */
export const AREA_DA_GRADE = { topo: 252, base: TAMANHO.altura }

/** Largura útil dentro do card, já descontado o padding dos dois lados. */
export const LARGURA_UTIL = CARD.largura - CARD.padding * 2

export function alturaDoCard(): number {
  return (
    CARD.padding +
    FOTO.altura +
    NOME.gapAcima +
    NOME.tamanho * NOME.entrelinha +
    SETOR.gapAcima +
    SETOR.tamanho * SETOR.entrelinha +
    TEMPO.gapAcima +
    TEMPO.tamanho * TEMPO.entrelinha +
    CARD.padding
  )
}

export function fonteTitulo(): string {
  return `italic 400 ${TITULO.tamanho}px "DM Serif Display", serif`
}

export function fonteOutfit(tamanho: number, negrito: boolean): string {
  return `${negrito ? 700 : 400} ${tamanho}px "Outfit Variable", sans-serif`
}
