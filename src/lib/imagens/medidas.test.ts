import { describe, expect, it } from 'vitest'
import { quebrarBloco } from '@/lib/imagens/medidas'
import type { Bloco } from '@/lib/imagens/tipos'

/** Medidor determinístico: 10px por caractere, sem diferença por peso. */
const medir = (texto: string) => texto.length * 10

/** Achata uma linha em string, para asserções legíveis. */
const texto = (linha: { texto: string }[]) => linha.map((t) => t.texto).join('')

describe('quebrarBloco', () => {
  it('mantém em uma linha o que cabe', () => {
    const bloco: Bloco = [{ texto: 'um dois', negrito: false }]
    const linhas = quebrarBloco(bloco, 200, medir)
    expect(linhas.map(texto)).toEqual(['um dois'])
  })

  it('quebra na última palavra que cabe', () => {
    const bloco: Bloco = [{ texto: 'um dois tres', negrito: false }]
    // 'um dois' = 70px; 'um dois tres' = 120px. Com 100 de largura, quebra.
    const linhas = quebrarBloco(bloco, 100, medir)
    expect(linhas.map(texto)).toEqual(['um dois', 'tres'])
  })

  it('devolve uma linha vazia para bloco vazio', () => {
    expect(quebrarBloco([], 100, medir)).toEqual([[]])
  })

  it('não junta a palavra ao trecho seguinte quando ele começa com pontuação', () => {
    const bloco: Bloco = [
      { texto: 'Mel', negrito: true },
      { texto: ', obrigada', negrito: false },
    ]
    const linhas = quebrarBloco(bloco, 1000, medir)
    expect(linhas).toHaveLength(1)
    expect(texto(linhas[0])).toBe('Mel, obrigada')
    expect(linhas[0]).toEqual([
      { texto: 'Mel', negrito: true },
      { texto: ', obrigada', negrito: false },
    ])
  })

  it('preserva o negrito quando a quebra cai depois da palavra em destaque', () => {
    const bloco: Bloco = [
      { texto: 'oi ', negrito: false },
      { texto: 'Mel', negrito: true },
      { texto: ' tudo bem', negrito: false },
    ]
    // 'oi Mel' = 60px, cabe; ' tudo' estouraria 80.
    const linhas = quebrarBloco(bloco, 80, medir)
    expect(linhas.map(texto)).toEqual(['oi Mel', 'tudo bem'])
    expect(linhas[0][1]).toEqual({ texto: 'Mel', negrito: true })
  })

  it('funde trechos vizinhos de mesmo peso em um só', () => {
    const bloco: Bloco = [
      { texto: 'um ', negrito: false },
      { texto: 'dois', negrito: false },
    ]
    const linhas = quebrarBloco(bloco, 1000, medir)
    expect(linhas[0]).toEqual([{ texto: 'um dois', negrito: false }])
  })

  it('deixa a palavra maior que a caixa em uma linha só, transbordando', () => {
    const bloco: Bloco = [{ texto: 'a interminavelmente b', negrito: false }]
    const linhas = quebrarBloco(bloco, 50, medir)
    expect(linhas.map(texto)).toEqual(['a', 'interminavelmente', 'b'])
  })
})
