/**
 * Regra de mês/anos de casa. Módulo puro: nenhuma dependência de rede,
 * nenhum acesso a `Date.now()` implícito — a data de referência é sempre
 * parâmetro.
 */

export interface DataSimples {
  ano: number
  mes: number // 1-12
  dia: number // 1-31
}

/** Mês de referência da lista: o corrente ou um dos próximos. */
export interface MesReferencia {
  ano: number
  mes: number // 1-12
}

/** Mês corrente + os 6 próximos. */
export const MESES_VISIVEIS = 7

export const MESES_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const

export function nomeDoMes(mes: number): string {
  return MESES_PT[mes - 1] ?? ''
}

/**
 * Parse de "YYYY-MM-DD" (ou "YYYY-MM-DDTHH:mm:ss..." — só o prefixo importa).
 *
 * NÃO usar `new Date(string)`: o parse nativo de uma data-only string é tratado
 * como UTC meia-noite, então em fuso negativo (BRT = UTC-3) `getDate()` devolve
 * o dia anterior. Aqui os números vêm direto do split, sem Date nenhum.
 */
export function parseDataNotion(valor: string): DataSimples | null {
  const [parteData] = valor.split('T')
  const partes = parteData.split('-')
  if (partes.length !== 3) return null

  const ano = Number(partes[0])
  const mes = Number(partes[1])
  const dia = Number(partes[2])

  if (!Number.isInteger(ano) || !Number.isInteger(mes) || !Number.isInteger(dia)) {
    return null
  }
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null

  return { ano, mes, dia }
}

/** Data local de hoje, sem passar por string (evita o bug de UTC). */
export function hojeLocal(agora: Date = new Date()): DataSimples {
  return {
    ano: agora.getFullYear(),
    mes: agora.getMonth() + 1,
    dia: agora.getDate(),
  }
}

export function mesAtual(agora: Date = new Date()): MesReferencia {
  const hoje = hojeLocal(agora)
  return { ano: hoje.ano, mes: hoje.mes }
}

/** Soma meses à referência, virando o ano quando passa de dezembro. */
export function avancarMes(referencia: MesReferencia, meses: number): MesReferencia {
  // Aritmética em base 0 pra o módulo funcionar em qualquer direção.
  const total = referencia.ano * 12 + (referencia.mes - 1) + meses
  return { ano: Math.floor(total / 12), mes: (total % 12) + 1 }
}

/** A referência mais os próximos, na ordem. */
export function proximosMeses(
  inicio: MesReferencia,
  quantidade: number = MESES_VISIVEIS,
): MesReferencia[] {
  return Array.from({ length: quantidade }, (_, i) => avancarMes(inicio, i))
}

export function mesmoMes(a: MesReferencia, b: MesReferencia): boolean {
  return a.ano === b.ano && a.mes === b.mes
}

/** Chave estável pra key de lista e comparação. */
export function chaveMes(referencia: MesReferencia): string {
  return `${referencia.ano}-${String(referencia.mes).padStart(2, '0')}`
}

/**
 * "setembro" quando é do ano base, "janeiro de 2027" quando não é — o ano só
 * aparece quando muda a resposta.
 */
export function rotuloMes(referencia: MesReferencia, anoBase: number): string {
  const nome = nomeDoMes(referencia.mes)
  return referencia.ano === anoBase ? nome : `${nome} de ${referencia.ano}`
}

/** Versão curta pro seletor: "set" ou "jan 27". */
export function rotuloMesCurto(
  referencia: MesReferencia,
  anoBase: number,
): string {
  const abreviado = nomeDoMes(referencia.mes).slice(0, 3)
  return referencia.ano === anoBase
    ? abreviado
    : `${abreviado} ${String(referencia.ano).slice(-2)}`
}

/**
 * Anos completos que a pessoa terá no mês de referência. Como só é chamado
 * quando o mês bate, a diferença de anos já é o tempo de casa completo.
 */
export function anosDeCasa(
  admissao: DataSimples,
  referencia: MesReferencia,
): number {
  return referencia.ano - admissao.ano
}

/**
 * Entra na lista quem tem o mês da admissão igual ao mês de referência E pelo
 * menos 1 ano completo. Quem entrou nesse mesmo mês do ano da referência fica
 * de fora (0 anos de casa).
 */
export function fazAniversarioDeCasa(
  admissao: DataSimples,
  referencia: MesReferencia,
): boolean {
  if (admissao.mes !== referencia.mes) return false
  return anosDeCasa(admissao, referencia) >= 1
}

/** Iniciais para o placeholder: primeira + última palavra do nome. */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  const primeira = partes[0][0]
  const ultima = partes[partes.length - 1][0]
  return (primeira + ultima).toUpperCase()
}
