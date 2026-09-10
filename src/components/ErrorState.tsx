import type { ErroApi } from '@/types/aniversariante'

interface ErrorStateProps {
  erro: ErroApi
  onRetry: () => void
}

const TITULOS: Record<ErroApi['tipo'], string> = {
  'nao-compartilhado': 'Database não encontrado (404)',
  'sem-config': 'Configuração incompleta',
  outro: 'Falha ao carregar',
}

export function ErrorState({ erro, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="surface flex flex-col items-start gap-5 border-[var(--danger-hairline)] bg-[var(--danger-tint)] p-8"
    >
      <div className="space-y-1.5">
        <p className="font-heading text-base font-medium tracking-tight text-[var(--ink)]">
          {TITULOS[erro.tipo]}
          {erro.status !== undefined && erro.tipo === 'outro'
            ? ` (HTTP ${erro.status})`
            : ''}
        </p>
        <p className="max-w-xl text-sm leading-relaxed text-[var(--ink-muted)]">
          {erro.mensagem}
        </p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="brand-gradient h-10 rounded-full px-6 text-sm font-semibold text-white shadow-[0_6px_20px_-8px_rgba(249,133,16,0.9)] transition-[filter,transform] hover:brightness-[1.04] active:translate-y-px"
      >
        Tentar de novo
      </button>
    </div>
  )
}
