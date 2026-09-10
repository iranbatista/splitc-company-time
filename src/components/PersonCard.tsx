import { Avatar } from '@/components/Avatar'
import type { Aniversariante } from '@/types/aniversariante'

interface PersonCardProps {
  pessoa: Aniversariante
}

export function PersonCard({ pessoa }: PersonCardProps) {
  const { nome, setores, dia, anos, fotoUrl } = pessoa

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
      </div>
    </article>
  )
}
