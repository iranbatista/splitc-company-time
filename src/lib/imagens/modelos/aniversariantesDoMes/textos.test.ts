import { describe, expect, it } from 'vitest'
import {
  TITULO,
  candidatosDeNome,
  comReticencia,
  encurtarNome,
  encurtarSetores,
  subtitulo,
  tempoDeCasa,
} from '@/lib/imagens/modelos/aniversariantesDoMes/textos'

/** Cabe quem tiver até N caracteres — medidor determinístico para o teste. */
const ate = (n: number) => (texto: string) => texto.length <= n

describe('subtitulo', () => {
  it('monta mês por extenso e ano', () => {
    expect(subtitulo({ ano: 2026, mes: 7 })).toBe('Mês de julho/2026')
  })
})

describe('tempoDeCasa', () => {
  it('singulariza um ano', () => {
    expect(tempoDeCasa(1)).toBe('1 ano')
    expect(tempoDeCasa(5)).toBe('5 anos')
  })
})

describe('TITULO', () => {
  it('é o texto acordado', () => {
    expect(TITULO).toBe('Aniversariantes de casa')
  })
})

describe('candidatosDeNome', () => {
  it('abrevia do último sobrenome para o primeiro e depois solta as iniciais', () => {
    expect(candidatosDeNome('Guilherme Almeida Souza')).toEqual([
      'Guilherme Almeida Souza',
      'Guilherme Almeida S.',
      'Guilherme A. S.',
      'Guilherme A.',
      'Guilherme',
    ])
  })

  it('nome de uma palavra só não tem o que encurtar', () => {
    expect(candidatosDeNome('Mel')).toEqual(['Mel'])
  })

  it('lida com espaços sobrando', () => {
    expect(candidatosDeNome('  Ana   Paula  ')).toEqual(['Ana Paula', 'Ana P.', 'Ana'])
  })
})

describe('encurtarNome', () => {
  it('devolve o nome inteiro quando cabe', () => {
    expect(encurtarNome('Alice Santos', ate(30))).toBe('Alice Santos')
  })

  it('desce a escada até caber', () => {
    // 'Guilherme Almeida S.' tem 20; com teto de 14 sobra 'Guilherme A.' (12).
    expect(encurtarNome('Guilherme Almeida Souza', ate(14))).toBe('Guilherme A.')
  })

  it('devolve o mais curto quando nada cabe', () => {
    expect(encurtarNome('Guilherme Almeida Souza', ate(3))).toBe('Guilherme')
  })
})

describe('encurtarSetores', () => {
  it('junta quando cabe', () => {
    expect(encurtarSetores(['CS', 'Revenue'], ate(30))).toBe('CS · Revenue')
  })

  it('fica com o primeiro quando a junção não cabe', () => {
    expect(encurtarSetores(['CS', 'Revenue'], ate(5))).toBe('CS')
  })

  it('devolve vazio para lista vazia', () => {
    expect(encurtarSetores([], ate(30))).toBe('')
  })
})

describe('comReticencia', () => {
  it('não mexe no que cabe', () => {
    expect(comReticencia('Engenharia', ate(30))).toBe('Engenharia')
  })

  it('corta e marca com reticência', () => {
    expect(comReticencia('Engenharia', ate(6))).toBe('Engen…')
  })
})
