/**
 * Monta a lista de um mês a partir das pessoas já carregadas. Puro: trocar de
 * mês não custa request nenhuma, porque o filtro do Notion não é por mês.
 */
import { anosDeCasa, fazAniversarioDeCasa } from '@/lib/aniversario'
import type { MesReferencia } from '@/lib/aniversario'
import type { Aniversariante, Pessoa } from '@/types/aniversariante'

/** Ordenado por dia do mês, ascendente. Empate resolvido por nome. */
export function aniversariantesDoMes(
  pessoas: readonly Pessoa[],
  referencia: MesReferencia,
): Aniversariante[] {
  return pessoas
    .filter((pessoa) => fazAniversarioDeCasa(pessoa.admissao, referencia))
    .map((pessoa) => ({
      ...pessoa,
      dia: pessoa.admissao.dia,
      anos: anosDeCasa(pessoa.admissao, referencia),
    }))
    .sort((a, b) => a.dia - b.dia || a.nome.localeCompare(b.nome, 'pt-BR'))
}

/** Quantas pessoas cada mês tem — alimenta o contador de cada pill. */
export function contagemPorMes(
  pessoas: readonly Pessoa[],
  meses: readonly MesReferencia[],
): number[] {
  return meses.map(
    (referencia) =>
      pessoas.filter((pessoa) =>
        fazAniversarioDeCasa(pessoa.admissao, referencia),
      ).length,
  )
}
