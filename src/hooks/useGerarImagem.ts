import { useCallback, useState } from 'react'
import { baixarBlob } from '@/lib/imagens/download'
import { gerarImagem } from '@/lib/imagens/gerar'
import type { Modelo } from '@/lib/imagens/tipos'

export type EstadoGeracao = 'ocioso' | 'gerando' | 'erro'

/**
 * Os params entram no `gerar`, não no hook: passados na criação, um objeto novo
 * a cada render invalidaria o `useCallback` sem parar.
 */
export function useGerarImagem<P>(modelo: Modelo<P>) {
  const [estado, setEstado] = useState<EstadoGeracao>('ocioso')

  const gerar = useCallback(
    async (params: P) => {
      setEstado('gerando')
      try {
        const blob = await gerarImagem(modelo, params)
        baixarBlob(blob, modelo.nomeArquivo(params))
        setEstado('ocioso')
      } catch (causa) {
        console.error(`[imagens] falha ao gerar "${modelo.id}"`, causa)
        setEstado('erro')
      }
    },
    [modelo],
  )

  return { estado, gerar }
}
