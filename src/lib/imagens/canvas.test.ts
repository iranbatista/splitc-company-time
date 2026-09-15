import { describe, expect, it } from 'vitest'
import { recorteCover } from '@/lib/imagens/canvas'

describe('recorteCover', () => {
  it('recorta as laterais quando o destino é mais alto em proporção', () => {
    // O shape da arte: 662x475 a partir de uma imagem 1200x627.
    // escala = max(662/1200, 475/627) = 0.7576 -> recorte de 874x627.
    const recorte = recorteCover({ largura: 1200, altura: 627 }, { largura: 662, altura: 475 })
    expect(recorte.sh).toBeCloseTo(627, 3)
    expect(recorte.sw).toBeCloseTo(873.86, 1)
    expect(recorte.sy).toBeCloseTo(0, 3)
    expect(recorte.sx).toBeCloseTo(163.07, 1)
  })

  it('recorta o topo e a base quando o destino é mais largo em proporção', () => {
    const recorte = recorteCover({ largura: 100, altura: 100 }, { largura: 200, altura: 100 })
    expect(recorte.sw).toBeCloseTo(100, 3)
    expect(recorte.sh).toBeCloseTo(50, 3)
    expect(recorte.sx).toBeCloseTo(0, 3)
    expect(recorte.sy).toBeCloseTo(25, 3)
  })

  it('não recorta nada quando as proporções são iguais', () => {
    const recorte = recorteCover({ largura: 1200, altura: 627 }, { largura: 600, altura: 313.5 })
    expect(recorte).toEqual({ sx: 0, sy: 0, sw: 1200, sh: 627 })
  })
})
