/** Bloco cinza do tamanho exato do conteúdo que vai substituí-lo. */
function Bar({ className }: { className: string }) {
  return <div className={`rounded-full bg-[var(--wash)] ${className}`} />
}

export function SkeletonCard() {
  return (
    <div
      aria-hidden
      className="surface flex flex-col items-center gap-4 p-6"
    >
      <div className="h-[6.5rem] w-[6.5rem] rounded-full bg-[var(--wash)]" />
      <Bar className="h-4 w-32" />
      <Bar className="h-2.5 w-20" />
      <Bar className="mt-auto h-7 w-28" />
      <Bar className="h-3 w-12" />
    </div>
  )
}

export function SkeletonGrid({ quantidade = 8 }: { quantidade?: number }) {
  return (
    <div
      role="status"
      aria-label="Carregando a lista"
      className="grid animate-pulse grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: quantidade }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
