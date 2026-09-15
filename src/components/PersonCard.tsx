import { Avatar } from '@/components/Avatar'
import { useGerarImagem } from '@/hooks/useGerarImagem'
import { aniversarioCasa } from '@/lib/imagens/modelos/aniversarioCasa'
import type { Aniversariante } from '@/types/aniversariante'

interface PersonCardProps {
  pessoa: Aniversariante
}

const ROTULO: Record<string, string> = {
  ocioso: 'Baixar imagem',
  gerando: 'Gerando…',
  erro: 'Tentar de novo',
}

export function PersonCard({ pessoa }: PersonCardProps) {
  const { nome, setores, dia, anos, fotoUrl } = pessoa
  const { estado, gerar } = useGerarImagem(aniversarioCasa)

  const motivo = aniversarioCasa.aplicavel({ nome, anos })
  const indisponivel = motivo === true ? null : motivo

  return (
    <article className="surface flex flex-col items-center gap-4 p-6 text-center transition-colors hover:bg-[var(--wash)]">
      <Avatar nome={nome} fotoUrl={fotoUrl} />

      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 className="font-heading text-[1.0625rem] font-medium leading-snug tracking-tight text-[var(--ink)]">
          {nome}
        </h2>
        {setores.length > 0 && (
          <p className="eyebrow">{setores.join(' · ')}</p>
        )}
      </div>

      <div className="mt-auto flex flex-col items-center gap-2 pt-1">
        {/* Tinta suave em vez do gradiente cheio: com 20 cards na tela o
            gradiente por card gritaria. Ele fica reservado ao header. */}
        <span className="rounded-full border border-[var(--brand-from)]/35 bg-[var(--tint)] px-3.5 py-1 text-[0.8125rem] font-semibold text-[var(--brand-ink)]">
          {anos} {anos === 1 ? 'ano' : 'anos'} de casa
        </span>
        <span className="text-xs text-[var(--ink-muted)]">dia {dia}</span>

        <button
          type="button"
          onClick={() => void gerar({ nome, anos })}
          disabled={indisponivel !== null || estado === 'gerando'}
          title={indisponivel ?? undefined}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-[var(--hairline)] px-3.5 py-1.5 text-[0.8125rem] font-medium text-[var(--ink-muted)] transition-colors hover:bg-[var(--tint)] hover:text-[var(--brand-ink)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-[var(--ink-muted)]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <path d="M8 2v8m0 0 3-3m-3 3L5 7" />
            <path d="M2.5 11.5v1a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1" />
          </svg>
          {ROTULO[estado]}
        </button>
      </div>
    </article>
  )
}
