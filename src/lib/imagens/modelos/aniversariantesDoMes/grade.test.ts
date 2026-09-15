import { describe, expect, it } from 'vitest'
import { distribuir } from '@/lib/imagens/modelos/aniversariantesDoMes/grade'

describe('distribuir', () => {
  it('cabe tudo em uma linha até 6', () => {
    expect(distribuir(3)).toEqual({ porLinha: [3], colunas: 3 })
    expect(distribuir(6)).toEqual({ porLinha: [6], colunas: 6 })
  })

  it('equilibra em vez de encher a primeira linha', () => {
    // 7 viram 4+3, e não 6+1.
    expect(distribuir(7)).toEqual({ porLinha: [4, 3], colunas: 4 })
    expect(distribuir(9)).toEqual({ porLinha: [5, 4], colunas: 5 })
  })

  it('reproduz o export: 10 pessoas em duas linhas de 5', () => {
    expect(distribuir(10)).toEqual({ porLinha: [5, 5], colunas: 5 })
  })

  it('abre a terceira linha só depois de 12', () => {
    expect(distribuir(12)).toEqual({ porLinha: [6, 6], colunas: 6 })
    expect(distribuir(13)).toEqual({ porLinha: [5, 5, 3], colunas: 5 })
  })

  it('nunca passa do máximo de colunas', () => {
    for (let n = 1; n <= 40; n += 1) {
      const { porLinha, colunas } = distribuir(n)
      expect(colunas).toBeLessThanOrEqual(6)
      expect(Math.max(...porLinha)).toBeLessThanOrEqual(6)
      expect(porLinha.reduce((a, b) => a + b, 0)).toBe(n)
    }
  })

  it('devolve grade vazia para ninguém', () => {
    expect(distribuir(0)).toEqual({ porLinha: [], colunas: 0 })
  })
})
