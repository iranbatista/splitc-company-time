import { nomeDoMes } from '@/lib/aniversario'
import type { MesReferencia } from '@/lib/aniversario'

export const TITULO = 'Aniversariantes de casa'

export function subtitulo(mes: MesReferencia): string {
  return `Mês de ${nomeDoMes(mes.mes)}/${mes.ano}`
}

export function tempoDeCasa(anos: number): string {
  return `${anos} ${anos === 1 ? 'ano' : 'anos'}`
}

/** Decide se um texto cabe na largura útil do card. */
export type Cabe = (texto: string) => boolean

/**
 * Candidatos de nome, do mais completo ao mais curto. Os sobrenomes viram
 * inicial de trás para frente e depois somem, até sobrar só o primeiro nome —
 * é a escada que o export percorreu à mão em "Guilherme A.".
 */
export function candidatosDeNome(nome: string): string[] {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return ['']
  if (partes.length === 1) return [partes[0]]

  const [primeiro, ...resto] = partes
  const candidatos = [partes.join(' ')]

  // Abrevia do último sobrenome para o primeiro.
  const atual = [...resto]
  for (let i = atual.length - 1; i >= 0; i -= 1) {
    atual[i] = `${atual[i][0]}.`
    candidatos.push([primeiro, ...atual].join(' '))
  }

  // Depois vai soltando as iniciais, da última para a primeira.
  for (let quantas = atual.length - 1; quantas >= 0; quantas -= 1) {
    candidatos.push([primeiro, ...atual.slice(0, quantas)].join(' '))
  }

  return [...new Set(candidatos)]
}

/** O primeiro candidato que couber; se nenhum couber, o mais curto. */
export function encurtarNome(nome: string, cabe: Cabe): string {
  const candidatos = candidatosDeNome(nome)
  return candidatos.find(cabe) ?? candidatos[candidatos.length - 1]
}

/**
 * Setores vêm como lista. Se a junção não couber, fica só o primeiro; se nem
 * ele couber, entra reticência — um setor cortado no meio confunde mais.
 */
export function encurtarSetores(setores: string[], cabe: Cabe): string {
  if (setores.length === 0) return ''
  const juntos = setores.join(' · ')
  if (cabe(juntos)) return juntos
  const primeiro = setores[0]
  return cabe(primeiro) ? primeiro : comReticencia(primeiro, cabe)
}

/** Corta o texto até caber, com reticência no fim. */
export function comReticencia(texto: string, cabe: Cabe): string {
  if (cabe(texto)) return texto
  for (let tamanho = texto.length - 1; tamanho > 0; tamanho -= 1) {
    const tentativa = `${texto.slice(0, tamanho).trimEnd()}…`
    if (cabe(tentativa)) return tentativa
  }
  return '…'
}
