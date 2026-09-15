/**
 * Página de conferência visual, só em dev: `vite build` tem index.html como
 * única entrada, então isto nunca vai para produção.
 *
 * Abra http://localhost:5173/preview.html e compare com a referência exportada
 * do Canva. `?anos=4` troca o tempo de casa; o padrão é 7, que é o ano da
 * referência.
 */
import '@fontsource-variable/outfit'
import '@fontsource/dm-serif-display/400-italic.css'
import { createRoot } from 'react-dom/client'
import { useEffect, useRef } from 'react'
import { gerarImagem } from '@/lib/imagens/gerar'
import { aniversarioCasa } from '@/lib/imagens/modelos/aniversarioCasa'
// Importada, não copiada para public/: como esta página está fora do grafo do
// build, a referência de 1,5MB nunca chega ao dist.
import referencia from '../docs/referencias/aniversario-casa.png'

function Preview() {
  const img = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const anos = Number(new URLSearchParams(location.search).get('anos') ?? 7)
    gerarImagem(aniversarioCasa, { nome: 'Mel Ferreira', anos })
      .then((blob) => {
        if (img.current) img.current.src = URL.createObjectURL(blob)
      })
      .catch((causa) => console.error('[preview]', causa))
  }, [])

  return (
    <div style={{ display: 'grid', gap: 16, padding: 16 }}>
      <img ref={img} id="gerada" width={1200} height={627} alt="gerada" />
      <img src={referencia} width={1200} height={627} alt="referência" />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Preview />)
