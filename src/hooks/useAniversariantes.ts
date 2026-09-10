import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buscarFoto, buscarPessoas, classificarErro, DATA_SOURCE_ID } from '@/lib/notion'
import { aniversariantesDoMes, contagemPorMes } from '@/lib/lista'
import type { MesReferencia } from '@/lib/aniversario'
import type { Aniversariante, ErroApi, Pessoa } from '@/types/aniversariante'

interface EstadoAniversariantes {
  /** A lista do mês de referência, já com as fotos que chegaram. */
  aniversariantes: Aniversariante[]
  /** Quantas pessoas cada mês do seletor tem. null enquanto a lista carrega. */
  contagens: number[] | null
  carregando: boolean
  erro: ErroApi | null
  /** true enquanto alguma foto do mês visível ainda está sendo buscada. */
  carregandoFotos: boolean
  recarregar: () => void
}

export function useAniversariantes(
  referencia: MesReferencia,
  meses: readonly MesReferencia[],
): EstadoAniversariantes {
  const [pessoas, setPessoas] = useState<Pessoa[] | null>(null)
  const [fotos, setFotos] = useState<Record<string, string | null>>({})
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<ErroApi | null>(null)
  const [tick, setTick] = useState(0)

  const recarregar = useCallback(() => setTick((t) => t + 1), [])

  /**
   * Geração da lista carregada. Trocar de mês NÃO invalida as fotos em voo —
   * elas continuam válidas e vão para o cache, então voltar num mês já visto
   * não refaz request. Só recarregar a lista (ou desmontar) invalida.
   */
  const geracao = useRef(0)
  const pedidas = useRef<Set<string>>(new Set())

  useEffect(() => () => {
    geracao.current = -1
  }, [])

  // ---- Lista: uma request (paginada) por carregamento, não por mês. ----
  useEffect(() => {
    geracao.current += 1
    const minha = geracao.current
    pedidas.current = new Set()

    async function carregar(): Promise<void> {
      setCarregando(true)
      setErro(null)
      setPessoas(null)
      setFotos({})

      if (!DATA_SOURCE_ID) {
        setErro(classificarErro(new Error('data source ausente')))
        setCarregando(false)
        return
      }

      try {
        const lista = await buscarPessoas()
        if (geracao.current !== minha) return
        setPessoas(lista)
      } catch (e) {
        if (geracao.current !== minha) return
        setErro(classificarErro(e))
      } finally {
        if (geracao.current === minha) setCarregando(false)
      }
    }

    void carregar()
  }, [tick])

  const doMes = useMemo(
    () => aniversariantesDoMes(pessoas ?? [], referencia),
    [pessoas, referencia],
  )

  // ---- Fotos: só as do mês visível, em background, com cache por página. ----
  useEffect(() => {
    const faltando = doMes.filter(
      (pessoa) => !(pessoa.id in fotos) && !pedidas.current.has(pessoa.id),
    )
    if (faltando.length === 0) return

    const minha = geracao.current
    for (const pessoa of faltando) pedidas.current.add(pessoa.id)

    // Todas as requests passam pelo limiter do módulo notion (3 em voo,
    // 1 start a cada 340ms), então disparar em paralelo aqui é seguro.
    void Promise.allSettled(
      faltando.map(async (pessoa) => {
        let url: string | null = null
        try {
          url = await buscarFoto(pessoa.id)
        } catch {
          // Foto é opcional: falha vira placeholder, não erro de tela.
          url = null
        }
        if (geracao.current !== minha) return
        setFotos((atual) => ({ ...atual, [pessoa.id]: url }))
      }),
    )
  }, [doMes, fotos])

  const aniversariantes = useMemo(
    () =>
      doMes.map((pessoa) => ({
        ...pessoa,
        fotoUrl: pessoa.id in fotos ? fotos[pessoa.id] : undefined,
      })),
    [doMes, fotos],
  )

  const contagens = useMemo(
    () => (pessoas === null ? null : contagemPorMes(pessoas, meses)),
    [pessoas, meses],
  )

  return {
    aniversariantes,
    contagens,
    carregando,
    erro,
    carregandoFotos: aniversariantes.some((p) => p.fotoUrl === undefined),
    recarregar,
  }
}
