interface EmptyStateProps {
  mes: string
}

export function EmptyState({ mes }: EmptyStateProps) {
  return (
    <div className="surface flex flex-col items-center gap-4 px-8 py-20 text-center">
      <p className="eyebrow">Mês vazio</p>
      <p className="font-heading text-lg font-medium tracking-tight text-[var(--ink)]">
        Ninguém faz aniversário de casa em {mes}.
      </p>
      <p className="max-w-sm text-sm leading-relaxed text-[var(--ink-muted)]">
        Só entram pessoas ativas com pelo menos 1 ano completo de empresa.
      </p>
    </div>
  )
}
