import { describe, expect, it } from 'vitest'
import { aniversarioCasa } from '@/lib/imagens/modelos/aniversarioCasa'

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
