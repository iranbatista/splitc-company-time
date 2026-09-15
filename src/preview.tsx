/**
 * Página de conferência visual, só em dev: `vite build` tem index.html como
 * única entrada, então isto nunca vai para produção.
 *
 * - /preview.html renderiza o aniversário individual; `?anos=4` troca o tempo
 *   de casa (padrão 7, que é o ano da referência).
 * - /preview.html?arte=mes renderiza a peça do mês; `?pessoas=7` troca quantas
 *   pessoas entram na grade.
 *
 * Em cada caso a referência exportada do Canva aparece embaixo, no mesmo
 * tamanho, para comparar rolando entre as duas.
 */
import '@fontsource-variable/outfit'
import '@fontsource/dm-serif-display/400-italic.css'
import { createRoot } from 'react-dom/client'
import { useEffect, useRef } from 'react'
import { gerarImagem } from '@/lib/imagens/gerar'
import { aniversarioCasa } from '@/lib/imagens/modelos/aniversarioCasa'
import { aniversariantesDoMes } from '@/lib/imagens/modelos/aniversariantesDoMes'
import type { PessoaNaArte } from '@/lib/imagens/modelos/aniversariantesDoMes'
import referenciaIndividual from '../docs/referencias/aniversario-casa.png'
import referenciaDoMes from '../docs/referencias/divulgacao-do-mes.png'

/** Nomes e setores do próprio export, para a comparação ser justa. */
const AMOSTRA: PessoaNaArte[] = [
  { nome: 'Alice Santos', setores: ['Revenue'], anos: 5 },
  { nome: 'Ary Guerra', setores: ['CS'], anos: 5 },
  { nome: 'Guilherme Almeida Souza', setores: ['CS'], anos: 2 },
  { nome: 'Lucas Anjos', setores: ['Revenue'], anos: 2 },
  { nome: 'Paulo Mendes', setores: ['CS'], anos: 2 },
  { nome: 'Ramon Gouvea', setores: ['CS'], anos: 2 },
  { nome: 'Bruno Felix', setores: ['CS'], anos: 1 },
  { nome: 'Gui Carmelo', setores: ['CS'], anos: 1 },
  { nome: 'Gabriel Calixto', setores: ['Revenue'], anos: 1 },
  { nome: 'Gui Camargo', setores: ['Engenharia'], anos: 1 },
]

function Preview() {
  const img = useRef<HTMLImageElement>(null)
  const parametros = new URLSearchParams(location.search)
  const arte = parametros.get('arte') ?? 'individual'
  const doMes = arte === 'mes'

  useEffect(() => {
    const gerar = doMes
      ? gerarImagem(aniversariantesDoMes, {
          mes: { ano: 2026, mes: 7 },
          pessoas: AMOSTRA.slice(0, Number(parametros.get('pessoas') ?? AMOSTRA.length)),
        })
      : gerarImagem(aniversarioCasa, {
          nome: 'Mel Ferreira',
          anos: Number(parametros.get('anos') ?? 7),
        })

    gerar
      .then((blob) => {
        if (img.current) img.current.src = URL.createObjectURL(blob)
      })
      .catch((causa) => console.error('[preview]', causa))
    // A geração depende só do que vem na URL, que não muda sem recarregar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const largura = doMes ? 1920 : 1200
  const altura = doMes ? 1080 : 627

  return (
    <div style={{ display: 'grid', gap: 16, padding: 16 }}>
      <img ref={img} id="gerada" width={largura} height={altura} alt="gerada" />
      <img
        src={doMes ? referenciaDoMes : referenciaIndividual}
        width={largura}
        height={altura}
        alt="referência"
      />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Preview />)
