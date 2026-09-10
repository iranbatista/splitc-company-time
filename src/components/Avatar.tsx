import { useEffect, useState } from 'react'
import { iniciais } from '@/lib/aniversario'

interface AvatarProps {
  nome: string
  /** undefined = foto ainda não chegou; null = pessoa sem foto. */
  fotoUrl: string | null | undefined
}

/**
 * O aro de marca fica sempre, independente do estado da foto: é a mesma ideia
 * de moldura do splitc-profile-picture e mantém a silhueta do card estável
 * enquanto as fotos chegam uma a uma.
 */
export function Avatar({ nome, fotoUrl }: AvatarProps) {
  const [falhou, setFalhou] = useState(false)

  // URL nova (ex.: recarregou a lista) limpa o estado de erro anterior.
  useEffect(() => {
    setFalhou(false)
  }, [fotoUrl])

  const carregando = fotoUrl === undefined
  const mostrarImagem = typeof fotoUrl === 'string' && !falhou

  return (
    <div className="brand-ring h-[6.5rem] w-[6.5rem] shrink-0">
      <div className="h-full w-full overflow-hidden rounded-full bg-[var(--card)]">
        {carregando && (
          // Sweep só no espaço da foto — o resto do card já está preenchido.
          <div
            aria-hidden
            className="relative h-full w-full overflow-hidden rounded-full bg-[var(--wash)]"
          >
            <div className="sweep absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-[rgba(249,133,16,0.16)] to-transparent" />
          </div>
        )}

        {!carregando && mostrarImagem && (
          <img
            src={fotoUrl}
            alt={nome}
            loading="lazy"
            // URL de bloco `file` é assinada e expira em ~1h: se der erro,
            // cai no mesmo placeholder de iniciais.
            onError={() => setFalhou(true)}
            className="h-full w-full rounded-full object-cover"
          />
        )}

        {!carregando && !mostrarImagem && (
          <div
            aria-hidden
            className="flex h-full w-full items-center justify-center rounded-full bg-[var(--tint)] text-[1.375rem] font-semibold tracking-tight text-[var(--brand-ink)]"
          >
            {iniciais(nome)}
          </div>
        )}
      </div>
    </div>
  )
}
