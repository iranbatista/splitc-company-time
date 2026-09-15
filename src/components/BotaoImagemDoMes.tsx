import { useGerarImagem } from '@/hooks/useGerarImagem'
import type { MesReferencia } from '@/lib/aniversario'
import { aniversariantesDoMes } from '@/lib/imagens/modelos/aniversariantesDoMes'
import type { Aniversariante } from '@/types/aniversariante'

interface BotaoImagemDoMesProps {
  mes: MesReferencia
  pessoas: Aniversariante[]
  /** As fotos chegam depois da lista; gerar antes sairia só com iniciais. */
  carregandoFotos: boolean
}

const ROTULO: Record<string, string> = {
  ocioso: 'Baixar imagem do mês',
  gerando: 'Gerando…',
  erro: 'Tentar de novo',
}

export function BotaoImagemDoMes({ mes, pessoas, carregandoFotos }: BotaoImagemDoMesProps) {
  const { estado, gerar } = useGerarImagem(aniversariantesDoMes)

  const motivo = aniversariantesDoMes.aplicavel({ mes, pessoas })
  const indisponivel =
    motivo !== true
      ? motivo
      : carregandoFotos
        ? 'Esperando as fotos carregarem — sem elas a imagem sai só com iniciais.'
        : null

  return (
    <div className="flex justify-start">
      <button
        type="button"
        onClick={() => void gerar({ mes, pessoas })}
        disabled={indisponivel !== null || estado === 'gerando'}
        title={indisponivel ?? undefined}
        className="brand-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M8 2v8m0 0 3-3m-3 3L5 7" />
          <path d="M2.5 11.5v1a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1" />
        </svg>
        {ROTULO[estado]}
      </button>
    </div>
  )
}
