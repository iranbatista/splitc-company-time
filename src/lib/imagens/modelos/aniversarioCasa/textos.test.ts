import { describe, expect, it } from 'vitest'
import {
  TITULO_1,
  corpo,
  primeiroNome,
  temCopy,
  titulo2,
} from '@/lib/imagens/modelos/aniversarioCasa/textos'

describe('primeiroNome', () => {
  it('pega a primeira palavra', () => {
    expect(primeiroNome('Mel Ferreira Lima')).toBe('Mel')
  })

  it('ignora espaços nas pontas e repetidos', () => {
    expect(primeiroNome('  Ana   Paula  ')).toBe('Ana')
  })

  it('devolve string vazia para nome vazio', () => {
    expect(primeiroNome('   ')).toBe('')
  })
})

describe('temCopy', () => {
  it('cobre de 1 a 7 anos', () => {
    expect([1, 2, 3, 4, 5, 6, 7].every(temCopy)).toBe(true)
  })

  it('não cobre 0 nem 8', () => {
    expect(temCopy(0)).toBe(false)
    expect(temCopy(8)).toBe(false)
  })

  it('não cobre não-inteiro', () => {
    expect(temCopy(1.5)).toBe(false)
  })
})

describe('titulo2', () => {
  it('interpola o número de anos', () => {
    expect(titulo2(7)).toBe('Parabéns pelo seu 7º ano na SplitC!')
  })
})

describe('TITULO_1', () => {
  it('é o texto da arte', () => {
    expect(TITULO_1).toBe('Aniversário de empresa')
  })
})

describe('corpo', () => {
  it('marca o primeiro nome como negrito e o resto como regular', () => {
    const blocos = corpo(1, 'Mel')
    const trechos = blocos.flat()
    const negritos = trechos.filter((t) => t.negrito)
    expect(negritos).toEqual([{ texto: 'Mel', negrito: true }])
  })

  it('abre o texto de 1 ano com o nome', () => {
    const [primeiro] = corpo(1, 'Mel')
    expect(primeiro[0]).toEqual({ texto: 'Mel', negrito: true })
    expect(primeiro[1].texto).toMatch(/^, há um ano/)
  })

  it('põe o nome no meio do segundo parágrafo em 2 anos', () => {
    const blocos = corpo(2, 'Mel')
    expect(blocos[0].some((t) => t.negrito)).toBe(false)
    expect(blocos[2][0]).toEqual({ texto: 'Mel', negrito: true })
  })

  it('separa parágrafos com um bloco vazio', () => {
    const blocos = corpo(1, 'Mel')
    expect(blocos[1]).toEqual([])
  })

  it('termina com a assinatura em duas linhas', () => {
    const blocos = corpo(7, 'Mel')
    const ultimos = blocos.slice(-2).map((bloco) => bloco.map((t) => t.texto).join(''))
    expect(ultimos).toEqual(['Com carinho,', 'SplitC'])
  })

  it('nunca deixa o marcador cru passar', () => {
    for (let anos = 1; anos <= 7; anos += 1) {
      const texto = corpo(anos, 'Mel')
        .map((bloco) => bloco.map((t) => t.texto).join(''))
        .join('\n')
      expect(texto).not.toContain('{nome}')
      expect(texto).toContain('Mel')
    }
  })

  it('lança para ano sem copy', () => {
    expect(() => corpo(8, 'Mel')).toThrow()
  })
})
