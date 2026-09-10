import type { DataSimples } from '@/lib/aniversario'

/** Pessoa como vem do Notion, antes de qualquer regra de mês. */
export interface Pessoa {
  id: string
  nome: string
  email: string | null
  setores: string[]
  admissao: DataSimples
}

/** Pessoa já resolvida para um mês de referência. */
export interface Aniversariante extends Pessoa {
  /** Dia do mês da admissão — usado para ordenar. */
  dia: number
  anos: number
  /** undefined = ainda buscando; null = pessoa sem foto na página. */
  fotoUrl?: string | null
}

export interface ErroApi {
  tipo: 'nao-compartilhado' | 'sem-config' | 'outro'
  mensagem: string
  status?: number
}
