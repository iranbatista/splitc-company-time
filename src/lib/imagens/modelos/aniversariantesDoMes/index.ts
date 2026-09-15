import { iniciais, nomeDoMes } from '@/lib/aniversario'
import type { MesReferencia } from '@/lib/aniversario'
import { urlDaFotoParaCanvas } from '@/lib/fotos'
import { caixaArredondada, coverEm, gradiente135 } from '@/lib/imagens/canvas'
import { distribuir } from '@/lib/imagens/modelos/aniversariantesDoMes/grade'
import {
  AREA_DA_GRADE,
  CARD,
  FOTO,
  LARGURA_UTIL,
  LOGO,
  NOME,
  SETOR,
  SUBTITULO,
  TAMANHO,
  TEMPO,
  TITULO,
  URL_BACKGROUND,
  URL_LOGO,
  alturaDoCard,
  fonteOutfit,
  fonteTitulo,
} from '@/lib/imagens/modelos/aniversariantesDoMes/layout'
import {
  TITULO as TEXTO_TITULO,
  encurtarNome,
  encurtarSetores,
  subtitulo,
  tempoDeCasa,
} from '@/lib/imagens/modelos/aniversariantesDoMes/textos'
import type { Caixa, Modelo, Recursos } from '@/lib/imagens/tipos'

/** O que a arte precisa saber de cada pessoa. */
export interface PessoaNaArte {
  nome: string
  setores: string[]
  anos: number
  fotoUrl?: string | null
}

export interface ParamsDoMes {
  mes: MesReferencia
  pessoas: PessoaNaArte[]
}

function fotosDe(pessoas: PessoaNaArte[]): string[] {
  return pessoas
    .map((p) => p.fotoUrl)
    .filter((url): url is string => typeof url === 'string' && url.length > 0)
    .map(urlDaFotoParaCanvas)
}

export const aniversariantesDoMes: Modelo<ParamsDoMes> = {
  id: 'aniversariantes-do-mes',
  nome: 'Aniversariantes do mês',
  tamanho: TAMANHO,
  imagens: ({ pessoas }) => [URL_BACKGROUND, URL_LOGO, ...fotosDe(pessoas)],
  fontes: [
    fonteTitulo(),
    fonteOutfit(SUBTITULO.tamanho, false),
    fonteOutfit(NOME.tamanho, false),
    fonteOutfit(SETOR.tamanho, true),
  ],

  aplicavel({ mes, pessoas }) {
    if (pessoas.length === 0) {
      return `Ninguém faz aniversário de casa em ${nomeDoMes(mes.mes)}.`
    }
    return true
  },

  nomeArquivo({ mes }) {
    return `aniversariantes-${mes.ano}-${String(mes.mes).padStart(2, '0')}.png`
  },

  desenhar(ctx, { mes, pessoas }, recursos) {
    const fundo = recursos.imagens.get(URL_BACKGROUND)
    const logo = recursos.imagens.get(URL_LOGO)
    if (!fundo || !logo) throw new Error('Recursos da arte não carregados.')

    ctx.drawImage(fundo, 0, 0, TAMANHO.largura, TAMANHO.altura)
    ctx.drawImage(logo, LOGO.x, LOGO.y, LOGO.largura, LOGO.altura)

    desenharCabecalho(ctx, mes)
    desenharGrade(ctx, pessoas, recursos)
  },
}

/**
 * Onde desenhar um texto para a tinta dele cair no ponto pedido. Com
 * textBaseline 'top' a tinta começa abaixo do y, e a lateral depende do glifo —
 * as métricas dizem quanto, então não precisa de offset chutado.
 */
function paraTinta(
  ctx: CanvasRenderingContext2D,
  texto: string,
  alvo: { x: number; y: number },
): { x: number; y: number } {
  const m = ctx.measureText(texto)
  return { x: alvo.x + m.actualBoundingBoxLeft, y: alvo.y + m.actualBoundingBoxAscent }
}

function desenharCabecalho(ctx: CanvasRenderingContext2D, mes: MesReferencia): void {
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  ctx.font = fonteTitulo()
  const ondeTitulo = paraTinta(ctx, TEXTO_TITULO, TITULO.tinta)
  ctx.fillStyle = gradiente135(ctx, {
    x: TITULO.tinta.x,
    y: TITULO.tinta.y,
    largura: ctx.measureText(TEXTO_TITULO).width,
    altura: TITULO.tamanho,
  })
  ctx.fillText(TEXTO_TITULO, ondeTitulo.x, ondeTitulo.y)

  const texto = subtitulo(mes)
  ctx.font = fonteOutfit(SUBTITULO.tamanho, false)
  ctx.fillStyle = SUBTITULO.cor
  const ondeSubtitulo = paraTinta(ctx, texto, SUBTITULO.tinta)
  ctx.fillText(texto, ondeSubtitulo.x, ondeSubtitulo.y)
}

function desenharGrade(
  ctx: CanvasRenderingContext2D,
  pessoas: PessoaNaArte[],
  recursos: Recursos,
): void {
  const grade = distribuir(pessoas.length)
  if (grade.colunas === 0) return

  const altura = alturaDoCard()
  const larguraBloco = grade.colunas * CARD.largura + (grade.colunas - 1) * CARD.gap
  const alturaBloco = grade.porLinha.length * altura + (grade.porLinha.length - 1) * CARD.gap

  const alturaDisponivel = AREA_DA_GRADE.base - AREA_DA_GRADE.topo
  // Rede de proteção: acima de 12 pessoas a grade passa da arte. Reduzir o
  // bloco inteiro mantém a proporção; cortar cards perderia gente.
  const reducao = Math.min(1, alturaDisponivel / alturaBloco)

  const x0 = (TAMANHO.largura - larguraBloco * reducao) / 2
  const y0 = AREA_DA_GRADE.topo + (alturaDisponivel - alturaBloco * reducao) / 2

  ctx.save()
  ctx.translate(x0, y0)
  ctx.scale(reducao, reducao)

  let indice = 0
  grade.porLinha.forEach((nesta, linha) => {
    for (let coluna = 0; coluna < nesta; coluna += 1) {
      // Linhas alinhadas à esquerda entre si: quem centraliza é o bloco.
      const caixa: Caixa = {
        x: coluna * (CARD.largura + CARD.gap),
        y: linha * (altura + CARD.gap),
        largura: CARD.largura,
        altura,
      }
      desenharCard(ctx, caixa, pessoas[indice], recursos)
      indice += 1
    }
  })

  ctx.restore()
}

function desenharCard(
  ctx: CanvasRenderingContext2D,
  caixa: Caixa,
  pessoa: PessoaNaArte,
  recursos: Recursos,
): void {
  // Fundo transparente: só a borda no gradiente da marca. O traço é desenhado
  // para dentro, encolhendo a caixa em meia espessura.
  const meia = CARD.borda / 2
  caixaArredondada(
    ctx,
    {
      x: caixa.x + meia,
      y: caixa.y + meia,
      largura: caixa.largura - CARD.borda,
      altura: caixa.altura - CARD.borda,
    },
    CARD.raio,
  )
  ctx.strokeStyle = gradiente135(ctx, caixa)
  ctx.lineWidth = CARD.borda
  ctx.stroke()

  const foto: Caixa = {
    x: caixa.x + (caixa.largura - FOTO.largura) / 2,
    y: caixa.y + CARD.padding,
    largura: FOTO.largura,
    altura: FOTO.altura,
  }
  desenharFoto(ctx, foto, pessoa, recursos)

  const centro = caixa.x + caixa.largura / 2
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  let y = foto.y + foto.altura + NOME.gapAcima

  ctx.font = fonteOutfit(NOME.tamanho, false)
  const cabe = (texto: string) => ctx.measureText(texto).width <= LARGURA_UTIL
  ctx.fillStyle = NOME.cor
  ctx.fillText(encurtarNome(pessoa.nome, cabe), centro, y)
  y += NOME.tamanho * NOME.entrelinha + SETOR.gapAcima

  ctx.font = fonteOutfit(SETOR.tamanho, true)
  const cabeSetor = (texto: string) => ctx.measureText(texto).width <= LARGURA_UTIL
  ctx.fillStyle = SETOR.cor
  ctx.fillText(encurtarSetores(pessoa.setores, cabeSetor), centro, y)
  y += SETOR.tamanho * SETOR.entrelinha + TEMPO.gapAcima

  ctx.font = fonteOutfit(TEMPO.tamanho, false)
  ctx.fillStyle = TEMPO.cor
  ctx.fillText(tempoDeCasa(pessoa.anos), centro, y)
}

function desenharFoto(
  ctx: CanvasRenderingContext2D,
  caixa: Caixa,
  pessoa: PessoaNaArte,
  recursos: Recursos,
): void {
  const url = pessoa.fotoUrl ? urlDaFotoParaCanvas(pessoa.fotoUrl) : null
  const imagem = url ? recursos.imagens.get(url) : undefined

  ctx.save()
  caixaArredondada(ctx, caixa, FOTO.raio)
  ctx.clip()

  if (imagem) {
    coverEm(ctx, imagem, caixa)
  } else {
    // Sem foto, ou foto que não passou pelo proxy: mesmas iniciais do card da
    // lista, para a pessoa não sumir da peça.
    ctx.fillStyle = gradiente135(ctx, caixa)
    ctx.fillRect(caixa.x, caixa.y, caixa.largura, caixa.altura)
    ctx.fillStyle = '#ffffff'
    ctx.font = fonteOutfit(FOTO.altura * 0.34, true)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(iniciais(pessoa.nome), caixa.x + caixa.largura / 2, caixa.y + caixa.altura / 2)
  }

  ctx.restore()
}
