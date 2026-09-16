import type { ChangeEvent } from 'react'
import { MESES_PT, nomeDoMes } from '@/lib/aniversario'

interface MonthPickerProps {
  selecionado: number // 1-12
  onSelect: (mes: number) => void
  /** null enquanto a lista carrega — sem número inventado no meio. Índice 0 = janeiro. */
  contagens: number[] | null
}

export function MonthPicker({ selecionado, onSelect, contagens }: MonthPickerProps) {
  function handleChange(evento: ChangeEvent<HTMLSelectElement>) {
    onSelect(Number(evento.target.value))
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="mes-picker" className="eyebrow">
        Mês
      </label>

      <div className="relative w-fit min-w-48">
        <select
          id="mes-picker"
          value={selecionado}
          onChange={handleChange}
          className="w-full appearance-none rounded-full border border-[var(--hairline)] bg-[var(--card)] py-2 pl-4 pr-10 text-sm font-semibold capitalize text-[var(--brand-ink)] transition-colors hover:bg-[var(--wash)]"
        >
          {MESES_PT.map((_, i) => {
            const mes = i + 1
            const total = contagens?.[i]
            return (
              <option key={mes} value={mes} className="capitalize text-[var(--ink)]">
                {nomeDoMes(mes)}
                {total !== undefined ? ` — ${total} ${total === 1 ? 'pessoa' : 'pessoas'}` : ''}
              </option>
            )
          })}
        </select>

        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]"
        >
          <path
            fill="currentColor"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.23 8.29a.75.75 0 0 1 0-1.08Z"
          />
        </svg>
      </div>
    </div>
  )
}
