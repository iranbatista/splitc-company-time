/**
 * Distribuição dos cards em linhas. Módulo puro: só aritmética, nenhuma
 * dependência de canvas.
 */

export const MAX_COLUNAS = 6

export interface Grade {
  /** Quantos cards em cada linha, na ordem. */
  porLinha: number[]
  /** Colunas da linha mais cheia — é o que define a largura do bloco. */
  colunas: number
}

/**
 * Enche o mínimo de linhas possível e depois equilibra: 7 pessoas viram 4+3, e
 * não 6+1. A última linha fica alinhada à esquerda junto com as outras; quem
 * centraliza é o bloco inteiro, pela linha mais cheia.
 */
export function distribuir(total: number, maxColunas: number = MAX_COLUNAS): Grade {
  if (total <= 0) return { porLinha: [], colunas: 0 }

  const linhas = Math.ceil(total / maxColunas)
  const colunas = Math.ceil(total / linhas)

  const porLinha: number[] = []
  let restante = total
  for (let i = 0; i < linhas; i += 1) {
    const nesta = Math.min(colunas, restante)
    porLinha.push(nesta)
    restante -= nesta
  }

  return { porLinha, colunas }
}
