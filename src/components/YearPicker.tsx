import type { ChangeEvent } from 'react'

interface YearPickerProps {
  anos: readonly number[]
  selecionado: number
  onSelect: (ano: number) => void
}

export function YearPicker({ anos, selecionado, onSelect }: YearPickerProps) {
  function handleChange(evento: ChangeEvent<HTMLSelectElement>) {
    onSelect(Number(evento.target.value))
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="ano-picker" className="eyebrow">
        Ano
      </label>

      <div className="relative w-fit min-w-28">
        <select
          id="ano-picker"
          value={selecionado}
          onChange={handleChange}
          className="w-full appearance-none rounded-full border border-[var(--hairline)] bg-[var(--card)] py-2 pl-4 pr-10 text-sm font-semibold text-[var(--brand-ink)] transition-colors hover:bg-[var(--wash)]"
        >
          {anos.map((ano) => (
            <option key={ano} value={ano} className="text-[var(--ink)]">
              {ano}
            </option>
          ))}
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
