import { useMemo, useState } from 'react'
import { BotaoImagemDoMes } from '@/components/BotaoImagemDoMes'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Header } from '@/components/Header'
import { MonthPicker } from '@/components/MonthPicker'
import { PersonCard } from '@/components/PersonCard'
import { SkeletonGrid } from '@/components/SkeletonCard'
import { useAniversariantes } from '@/hooks/useAniversariantes'
import {
  mesAtual,
  mesmoMes,
  nomeDoMes,
  proximosMeses,
  rotuloMes,
} from '@/lib/aniversario'

export default function App() {
  // Uma leitura só do relógio: o mês corrente é a origem do seletor e o
  // default da seleção.
  const atual = useMemo(() => mesAtual(), [])
  const meses = useMemo(() => proximosMeses(atual), [atual])
  const [selecionado, setSelecionado] = useState(atual)

  const {
    aniversariantes,
    contagens,
    carregando,
    erro,
    carregandoFotos,
    recarregar,
  } = useAniversariantes(selecionado, meses)

  const rotulo = rotuloMes(selecionado, atual.ano)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-14">
      <Header
        mesNome={nomeDoMes(selecionado.mes)}
        ano={selecionado.ano === atual.ano ? null : selecionado.ano}
        ehMesAtual={mesmoMes(selecionado, atual)}
        total={aniversariantes.length}
        carregando={carregando}
        carregandoFotos={carregandoFotos}
        comErro={erro !== null}
      />

      <MonthPicker
        meses={meses}
        selecionado={selecionado}
        onSelect={setSelecionado}
        contagens={erro ? null : contagens}
        anoBase={atual.ano}
      />

      {!erro && !carregando && aniversariantes.length > 0 && (
        <BotaoImagemDoMes
          mes={selecionado}
          pessoas={aniversariantes}
          carregandoFotos={carregandoFotos}
        />
      )}

      {erro ? (
        <ErrorState erro={erro} onRetry={recarregar} />
      ) : carregando ? (
        <SkeletonGrid />
      ) : aniversariantes.length === 0 ? (
        <EmptyState mes={rotulo} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {aniversariantes.map((pessoa) => (
            <PersonCard key={pessoa.id} pessoa={pessoa} />
          ))}
        </div>
      )}
    </main>
  )
}
