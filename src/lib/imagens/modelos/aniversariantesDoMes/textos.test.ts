import { describe, expect, it } from 'vitest'
import {
  TITULO,
  candidatosDeNome,
  comReticencia,
  encurtarNome,
  encurtarSetores,
  nomeCurto,
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

describe('nomeCurto', () => {
  it('fica com o primeiro e o último, largando os do meio', () => {
    expect(nomeCurto('Guilherme Almeida Souza')).toBe('Guilherme Souza')
    expect(nomeCurto('Alícia Costa Moura')).toBe('Alícia Moura')
  })

  it('não mexe em nome de uma ou duas palavras', () => {
    expect(nomeCurto('Mel')).toBe('Mel')
    expect(nomeCurto('Felipe Ramirez')).toBe('Felipe Ramirez')
  })

  it('mantém a partícula colada ao sobrenome', () => {
    expect(nomeCurto('Maria de Souza')).toBe('Maria de Souza')
    expect(nomeCurto('Ana Paula dos Santos')).toBe('Ana dos Santos')
    expect(nomeCurto('João Pedro da Silva')).toBe('João da Silva')
  })

  it('leva mais de uma partícula quando vierem seguidas', () => {
    expect(nomeCurto('Maria Fernanda de la Cruz')).toBe('Maria de la Cruz')
  })

  it('ignora maiúscula na partícula', () => {
    expect(nomeCurto('Ana Carolina De Souza')).toBe('Ana De Souza')
  })

  it('não come o primeiro nome quando ele vem seguido de partícula', () => {
    expect(nomeCurto('Ana de Souza')).toBe('Ana de Souza')
  })

  it('lida com espaços sobrando', () => {
    expect(nomeCurto('  Ana   Paula   Lima ')).toBe('Ana Lima')
  })
})

describe('candidatosDeNome', () => {
  it('desce do nome curto para o primeiro nome', () => {
    expect(candidatosDeNome('Guilherme Almeida Souza')).toEqual([
      'Guilherme Souza',
      'Guilherme',
    ])
  })

  it('nome de uma palavra só não tem o que encurtar', () => {
    expect(candidatosDeNome('Mel')).toEqual(['Mel'])
  })
})

describe('encurtarNome', () => {
  it('devolve o nome quando ele já é primeiro e último', () => {
    expect(encurtarNome('Alice Santos', ate(30))).toBe('Alice Santos')
  })

  it('usa primeiro e último mesmo quando o nome inteiro caberia', () => {
    expect(encurtarNome('Guilherme Almeida Souza', ate(40))).toBe('Guilherme Souza')
  })

  it('cai no primeiro nome quando nem o curto cabe', () => {
    expect(encurtarNome('Guilherme Almeida Souza', ate(14))).toBe('Guilherme')
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
