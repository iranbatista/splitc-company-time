import { describe, expect, it } from 'vitest'
import { aniversarioCasa } from '@/lib/imagens/modelos/aniversarioCasa'
import { ESCALAS_CORPO } from '@/lib/imagens/modelos/aniversarioCasa/layout'

describe('aplicavel', () => {
  it('vale de 1 a 7 anos', () => {
    for (let anos = 1; anos <= 7; anos += 1) {
      expect(aniversarioCasa.aplicavel({ nome: 'Mel', anos })).toBe(true)
    }
  })

  it('devolve o motivo, e não false, para quem está fora da faixa', () => {
    // O motivo vira o title do botão desabilitado, então precisa ser legível.
    const motivo = aniversarioCasa.aplicavel({ nome: 'Mel', anos: 8 })
    expect(typeof motivo).toBe('string')
    expect(motivo).toContain('8')
  })

  it('recusa quem ainda não completou um ano', () => {
    expect(aniversarioCasa.aplicavel({ nome: 'Mel', anos: 0 })).not.toBe(true)
  })
})

describe('nomeArquivo', () => {
  it('tira acento e espaço do nome', () => {
    expect(aniversarioCasa.nomeArquivo({ nome: 'Mel Ferreira Conceição', anos: 3 })).toBe(
      'aniversario-mel-ferreira-conceicao-3-anos.png',
    )
  })
})

describe('ESCALAS_CORPO', () => {
  it('vai de 100% a 80%', () => {
    // O laço antigo somava -0.02 repetidamente e parava em 0,82: o erro de
    // ponto flutuante fazia o último degrau falhar na comparação.
    expect(ESCALAS_CORPO[0]).toBe(1)
    expect(ESCALAS_CORPO[ESCALAS_CORPO.length - 1]).toBeCloseTo(0.8, 10)
  })

  it('desce sempre, sem repetir degrau', () => {
    for (let i = 1; i < ESCALAS_CORPO.length; i += 1) {
      expect(ESCALAS_CORPO[i]).toBeLessThan(ESCALAS_CORPO[i - 1])
    }
  })
})
