interface HeaderProps {
  /** Só o nome do mês. O ano vai separado pra não entrar no gradiente. */
  mesNome: string
  /** Ano do mês selecionado, ou null quando é o ano corrente. */
  ano: number | null
  ehMesAtual: boolean
  total: number
  carregando: boolean
  carregandoFotos: boolean
  /** Com erro na tela a contagem seria "0 pessoas" — mentira útil pra ninguém. */
  comErro: boolean
}

export function Header({
  mesNome,
  ano,
  ehMesAtual,
  total,
  carregando,
  carregandoFotos,
  comErro,
}: HeaderProps) {
  const quando = ehMesAtual ? 'este mês' : 'nesse mês'
  const legenda = comErro
    ? 'Não foi possível carregar a lista.'
    : carregando
      ? 'Carregando a lista…'
      : `${total} ${total === 1 ? 'pessoa comemora' : 'pessoas comemoram'} tempo de casa ${quando}.`

  return (
    <header className="space-y-3">
      <p className="eyebrow">Ferramenta interna</p>

      <h1 className="max-w-2xl font-heading text-[2.5rem] font-semibold leading-[1.1] tracking-tight text-[var(--ink)]">
        {/* O ano fica fora do .brand-text: com o span quebrando em duas
            linhas, o gradiente reinicia em cada linha. */}
        Aniversários de empresa em <span className="brand-text">{mesNome}</span>
        {ano !== null && ` de ${ano}`}
      </h1>

      <p className="max-w-xl text-[15px] leading-relaxed text-[var(--ink-muted)]">
        {legenda}
        {carregandoFotos && (
          <span className="ml-1 text-[var(--brand-ink)]">Buscando as fotos…</span>
        )}
      </p>
    </header>
  )
}
