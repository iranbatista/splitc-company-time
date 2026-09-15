import {
  caixaArredondada,
  coverEm,
  desenharEscalado,
  desenharLinhas,
  gradiente135,
  larguraMaxima,
} from '@/lib/imagens/canvas'
import { quebrarBloco } from '@/lib/imagens/medidas'
import {
  CORPO,
  FUNDO_PRINCIPAL,
  FUNDO_SHAPE_ESPELHADO,
  GAP_TITULO_CORPO,
  LARGURA_CONTEUDO,
  LOGO,
  PADDING_SHAPE,
  RAIO_SHAPE,
  TAMANHO,
  TITULO_1,
  TITULO_2,
  TRACKING,
  URL_BACKGROUND,
  URL_LOGO,
  X_CONTEUDO,
  caixaShape,
  fonteOutfit,
  fonteTitulo1,
} from '@/lib/imagens/modelos/aniversarioCasa/layout'
import {
  ANOS_MAX,
  ANOS_MIN,
  TITULO_1 as TEXTO_TITULO_1,
  corpo,
  primeiroNome,
  temCopy,
  titulo2,
} from '@/lib/imagens/modelos/aniversarioCasa/textos'
import type { Linha, Modelo } from '@/lib/imagens/tipos'

export interface ParamsAniversario {
  nome: string
  anos: number
}

/** Nome de arquivo sem acento nem espaço. */
function slug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const aniversarioCasa: Modelo<ParamsAniversario> = {
  id: 'aniversario-casa',
  nome: 'Aniversário de casa',
  tamanho: TAMANHO,
  imagens: [URL_BACKGROUND, URL_LOGO],
  fontes: [fonteTitulo1(), fonteOutfit(TITULO_2.tamanho, true), fonteOutfit(CORPO.tamanho, false)],

  aplicavel({ anos }) {
    if (!temCopy(anos)) {
      return `Só temos texto de ${ANOS_MIN} a ${ANOS_MAX} anos de casa (esta pessoa tem ${anos}).`
    }
    return true
  },

  nomeArquivo({ nome, anos }) {
    return `aniversario-${slug(nome)}-${anos}-anos.png`
  },

  desenhar(ctx, { nome, anos }, recursos) {
    const fundo = recursos.imagens.get(URL_BACKGROUND)
    const logo = recursos.imagens.get(URL_LOGO)
    if (!fundo || !logo) throw new Error('Recursos da arte não carregados.')

    // Vale para todo o texto da arte, e precisa valer também nas medições:
    // measureText respeita o letterSpacing corrente.
    ctx.letterSpacing = TRACKING
    ctx.textBaseline = 'top'

    // O shape abraça o texto, então o conteúdo é medido antes de haver shape.
    const conteudo = medirConteudo(ctx, anos, primeiroNome(nome))
    const shape = caixaShape(conteudo.altura)

    desenharEscalado(ctx, fundo, FUNDO_PRINCIPAL)
    ctx.drawImage(logo, LOGO.x, LOGO.y, LOGO.largura, LOGO.altura)

    // A mesma imagem, em outra escala e outro deslocamento: o shape é uma
    // janela para outra região do fundo, e é daí que vem o contraste.
    ctx.save()
    caixaArredondada(ctx, shape, RAIO_SHAPE)
    ctx.clip()
    coverEm(ctx, fundo, shape, FUNDO_SHAPE_ESPELHADO)
    ctx.restore()

    desenharConteudo(ctx, conteudo, shape.y)
    desenharTitulo1(ctx)
  },
}

/** Tudo que o shape precisa conter, com os deslocamentos a partir do topo dele. */
interface Conteudo {
  linhasTitulo: Linha[]
  entrelinhaTitulo: number
  deslocamentoTitulo: number
  blocosCorpo: Linha[][]
  entrelinhaCorpo: number
  deslocamentoCorpo: number
  altura: number
}

function medirConteudo(ctx: CanvasRenderingContext2D, anos: number, nome: string): Conteudo {
  const fonteTitulo = (negrito: boolean) => fonteOutfit(TITULO_2.tamanho, negrito)
  const fonteCorpo = (negrito: boolean) => fonteOutfit(CORPO.tamanho, negrito)

  ctx.font = fonteTitulo(true)
  const texto = titulo2(anos)
  const linhasTitulo = quebrarBloco(
    [{ texto, negrito: true }],
    LARGURA_CONTEUDO,
    (t: string) => ctx.measureText(t).width,
  )
  const entrelinhaTitulo = TITULO_2.tamanho * TITULO_2.entrelinha
  const deslocamentoTitulo = PADDING_SHAPE + TITULO_2.recuoTopo

  // O gap de 20px separa as caixas de tinta, como o Canva empilha os elementos,
  // e não as caixas de linha. Por isso a posição do corpo sai das métricas reais
  // do texto desenhado, não da altura nominal da linha.
  const baseTitulo =
    deslocamentoTitulo +
    (linhasTitulo.length - 1) * entrelinhaTitulo +
    ctx.measureText(texto).actualBoundingBoxDescent

  const entrelinhaCorpo = CORPO.tamanho * CORPO.entrelinha
  const blocosCorpo = corpo(anos, nome).map((bloco) =>
    quebrarBloco(bloco, LARGURA_CONTEUDO, (t: string, negrito: boolean) => {
      ctx.font = fonteCorpo(negrito)
      return ctx.measureText(t).width
    }),
  )

  ctx.font = fonteCorpo(false)
  // Com textBaseline 'top' a tinta começa abaixo do y pedido, e o ascent vem
  // negativo justamente com essa distância.
  const recuoTinta = -ctx.measureText('A').actualBoundingBoxAscent
  const descida = ctx.measureText('Sg').actualBoundingBoxDescent
  const deslocamentoCorpo = baseTitulo + GAP_TITULO_CORPO - recuoTinta

  const linhas = blocosCorpo.reduce((soma, bloco) => soma + bloco.length, 0)
  const fimDaTinta = deslocamentoCorpo + (linhas - 1) * entrelinhaCorpo + descida

  return {
    linhasTitulo,
    entrelinhaTitulo,
    deslocamentoTitulo,
    blocosCorpo,
    entrelinhaCorpo,
    deslocamentoCorpo,
    altura: Math.round(fimDaTinta + PADDING_SHAPE),
  }
}

function desenharConteudo(
  ctx: CanvasRenderingContext2D,
  conteudo: Conteudo,
  topoDoShape: number,
): void {
  const fonteTitulo = (negrito: boolean) => fonteOutfit(TITULO_2.tamanho, negrito)
  const fonteCorpo = (negrito: boolean) => fonteOutfit(CORPO.tamanho, negrito)

  const yTitulo = topoDoShape + conteudo.deslocamentoTitulo
  ctx.fillStyle = gradiente135(ctx, {
    x: X_CONTEUDO,
    y: yTitulo,
    largura: larguraMaxima(ctx, conteudo.linhasTitulo, fonteTitulo),
    altura: conteudo.linhasTitulo.length * conteudo.entrelinhaTitulo,
  })
  desenharLinhas(
    ctx,
    conteudo.linhasTitulo,
    X_CONTEUDO,
    yTitulo,
    conteudo.entrelinhaTitulo,
    fonteTitulo,
  )

  ctx.fillStyle = CORPO.cor
  let y = topoDoShape + conteudo.deslocamentoCorpo
  for (const bloco of conteudo.blocosCorpo) {
    desenharLinhas(ctx, bloco, X_CONTEUDO, y, conteudo.entrelinhaCorpo, fonteCorpo)
    y += bloco.length * conteudo.entrelinhaCorpo
  }
}

function desenharTitulo1(ctx: CanvasRenderingContext2D): void {
  const fonte = () => fonteTitulo1()
  ctx.font = fonte()

  const linhas = quebrarBloco(
    [{ texto: TEXTO_TITULO_1, negrito: false }],
    TITULO_1.larguraMax,
    (texto: string) => ctx.measureText(texto).width,
  )

  const entrelinha = TITULO_1.tamanho * TITULO_1.entrelinha
  // Ancorado na base: o bloco cresce para cima, então a primeira linha recua
  // uma entrelinha por linha extra.
  const primeiraBase = TITULO_1.base - (linhas.length - 1) * entrelinha
  const topo = primeiraBase - TITULO_1.tamanho

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = gradiente135(ctx, {
    x: TITULO_1.x,
    y: topo,
    largura: larguraMaxima(ctx, linhas, fonte),
    altura: linhas.length * entrelinha,
  })
  desenharLinhas(ctx, linhas, TITULO_1.x, primeiraBase, entrelinha, fonte)
}
