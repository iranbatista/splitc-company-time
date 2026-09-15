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
 * Partículas que se colam ao sobrenome. Ficam junto do último nome, senão
 * "Maria de Souza" viraria "Maria Souza" e "João da Silva", "João Silva".
 */
const PARTICULAS = new Set([
  'de', 'da', 'do', 'das', 'dos',
  'e',
  'di', 'du', 'del', 'della', 'dalla',
  'la', 'le', 'van', 'von', 'y',
])

/**
 * Primeiro e último nome, com a partícula que vier antes do último. Nomes do
 * meio saem: abreviar em iniciais ("Guilherme A. S.") ficava ruim de ler.
 */
export function nomeCurto(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length <= 2) return partes.join(' ')

  let inicioDoSobrenome = partes.length - 1
  // Anda para trás enquanto for partícula, sem nunca comer o primeiro nome.
  while (
    inicioDoSobrenome - 1 > 0 &&
    PARTICULAS.has(partes[inicioDoSobrenome - 1].toLowerCase())
  ) {
    inicioDoSobrenome -= 1
  }

  return [partes[0], ...partes.slice(inicioDoSobrenome)].join(' ')
}

/** Do nome curto para o primeiro nome, se nem ele couber no card. */
export function candidatosDeNome(nome: string): string[] {
  const curto = nomeCurto(nome)
  const primeiro = curto.split(' ')[0] ?? ''
  return [...new Set([curto, primeiro])]
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
