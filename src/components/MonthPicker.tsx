import { chaveMes, mesmoMes, rotuloMesCurto } from '@/lib/aniversario'
import type { MesReferencia } from '@/lib/aniversario'

interface MonthPickerProps {
  meses: readonly MesReferencia[]
  selecionado: MesReferencia
  onSelect: (mes: MesReferencia) => void
  /** null enquanto a lista carrega — sem número inventado no meio. */
  contagens: number[] | null
  /** Ano corrente: os meses desse ano não repetem o ano no rótulo. */
  anoBase: number
}

export function MonthPicker({
  meses,
  selecionado,
  onSelect,
  contagens,
  anoBase,
}: MonthPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="eyebrow">Mês</p>

      {/* Rola no eixo x em telas estreitas em vez de quebrar em duas linhas. */}
      <div
        role="group"
        aria-label="Mês da lista"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        {meses.map((mes, i) => {
          const ativo = mesmoMes(mes, selecionado)
          const total = contagens?.[i]

          return (
            <button
              key={chaveMes(mes)}
              type="button"
              aria-pressed={ativo}
              onClick={() => onSelect(mes)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                ativo
                  ? 'border-[var(--brand-from)] bg-[var(--tint)] font-semibold text-[var(--brand-ink)]'
                  : 'border-[var(--hairline)] bg-[var(--card)] text-[var(--ink-muted)] hover:bg-[var(--wash)]'
              }`}
            >
              <span className="capitalize">{rotuloMesCurto(mes, anoBase)}</span>
              {total !== undefined && (
                <span
                  aria-label={`${total} ${total === 1 ? 'pessoa' : 'pessoas'}`}
                  className={`min-w-5 rounded-full px-1.5 text-xs leading-5 ${
                    ativo
                      ? 'bg-[var(--brand-from)]/15 text-[var(--brand-ink)]'
                      : 'bg-[var(--wash)] text-[var(--ink-muted)]'
                  }`}
                >
                  {total}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
