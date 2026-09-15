import type { Bloco, Linha, Trecho } from '@/lib/imagens/tipos'

/** Largura de um texto em pixels, no peso dado. Injetado para manter este módulo puro. */
export type Medidor = (texto: string, negrito: boolean) => number

/**
 * Uma palavra pode atravessar trechos de pesos diferentes ('Mel' em negrito
 * seguido de ', obrigada' regular formam a palavra 'Mel,'), então a unidade de
 * quebra é uma lista de trechos, não uma string.
 */
type Palavra = Trecho[]

/**
 * Separa em palavras pelo espaço em branco do texto concatenado. Fatiar trecho
 * a trecho quebraria 'Mel' e ',' em palavras diferentes e a vírgula desceria
 * sozinha para a linha de baixo.
 */
function emPalavras(bloco: Bloco): Palavra[] {
  const palavras: Palavra[] = []
  let atual: Palavra = []

  const fechar = () => {
    if (atual.length > 0) {
      palavras.push(atual)
      atual = []
    }
  }

  for (const trecho of bloco) {
    for (const parte of trecho.texto.split(/(\s+)/)) {
      if (parte === '') continue
      if (/^\s+$/.test(parte)) {
        fechar()
        continue
      }
      atual.push({ texto: parte, negrito: trecho.negrito })
    }
  }
  fechar()

  return palavras
}

function largura(palavra: Palavra, medir: Medidor): number {
  return palavra.reduce((soma, trecho) => soma + medir(trecho.texto, trecho.negrito), 0)
}

/** Vizinhos de mesmo peso viram um trecho só: menos trocas de fonte no desenho. */
function fundir(trechos: Trecho[]): Linha {
  const saida: Trecho[] = []
  for (const trecho of trechos) {
    const ultimo = saida[saida.length - 1]
    if (ultimo && ultimo.negrito === trecho.negrito) {
      ultimo.texto += trecho.texto
    } else {
      saida.push({ ...trecho })
    }
  }
  return saida
}

/**
 * Quebra um bloco na largura disponível. Palavra mais larga que a caixa fica
 * sozinha na linha e transborda — hifenizar seria pior num texto de marca.
 *
 * Bloco vazio devolve uma linha vazia, e não nenhuma: é o que faz a linha em
 * branco entre parágrafos ocupar altura como qualquer outra.
 */
export function quebrarBloco(bloco: Bloco, larguraMax: number, medir: Medidor): Linha[] {
  const palavras = emPalavras(bloco)
  if (palavras.length === 0) return [[]]

  const espaco = medir(' ', false)
  const linhas: Linha[] = []
  let atual: Trecho[] = []
  let acumulada = 0

  for (const palavra of palavras) {
    const larguraPalavra = largura(palavra, medir)

    if (atual.length === 0) {
      atual = [...palavra]
      acumulada = larguraPalavra
      continue
    }

    if (acumulada + espaco + larguraPalavra > larguraMax) {
      linhas.push(fundir(atual))
      atual = [...palavra]
      acumulada = larguraPalavra
      continue
    }

    // O espaço entra sempre como regular: é medido assim, e um espaço em
    // negrito não muda nada visualmente.
    atual.push({ texto: ' ', negrito: false }, ...palavra)
    acumulada += espaco + larguraPalavra
  }

  linhas.push(fundir(atual))

  return linhas
}
