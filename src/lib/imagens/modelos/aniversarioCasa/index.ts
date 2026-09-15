import {
  caixaArredondada,
  coverEm,
  desenharLinhas,
  gradiente135,
  larguraMaxima,
} from '@/lib/imagens/canvas'
import { quebrarBloco } from '@/lib/imagens/medidas'
import {
  CONTEUDO,
  CORPO,
  ESCALAS_CORPO,
  GAP_TITULO_CORPO,
  LIMITE_CORPO,
  LOGO,
  RAIO_SHAPE,
  SHAPE,
  TAMANHO,
  TITULO_1,
  TITULO_2,
  TRACKING,
  URL_BACKGROUND,
  URL_LOGO,
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

    // O background já vem em 1200x627, então é desenho 1:1.
    // Vale para todo o texto da arte, e precisa valer também nas medições:
    // measureText respeita o letterSpacing corrente.
    ctx.letterSpacing = TRACKING

    ctx.drawImage(fundo, 0, 0, TAMANHO.largura, TAMANHO.altura)
    ctx.drawImage(logo, LOGO.x, LOGO.y, LOGO.largura, LOGO.altura)

    // O mesmo fundo em cover dentro do shape: o zoom do recorte é o que cria o
    // contraste com o fundo principal.
    ctx.save()
    caixaArredondada(ctx, SHAPE, RAIO_SHAPE)
    ctx.clip()
    coverEm(ctx, fundo, SHAPE)
    ctx.restore()

    desenharTitulo1(ctx)
    desenharConteudo(ctx, anos, primeiroNome(nome))
  },
}

function desenharTitulo1(ctx: CanvasRenderingContext2D): void {
  const fonte = () => fonteTitulo1()
  ctx.font = fonte()
  const medir = (texto: string) => ctx.measureText(texto).width

  const linhas = quebrarBloco(
    [{ texto: TEXTO_TITULO_1, negrito: false }],
    TITULO_1.larguraMax,
    medir,
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

interface CorpoAjustado {
  blocos: Linha[][]
  entrelinha: number
  fonte: (negrito: boolean) => string
  y: number
}

/**
 * A arte foi desenhada em cima do texto de 7 anos. O de 5 anos é uma linha mais
 * longo do que o shape comporta, então esse ano (e só ele) desce degraus de
 * tipografia até a última linha caber. Os outros seis saem no tamanho original.
 */
function ajustarCorpo(
  ctx: CanvasRenderingContext2D,
  anos: number,
  nome: string,
  baseTitulo: number,
): CorpoAjustado {
  const blocosDeTexto = corpo(anos, nome)
  let ultimo: CorpoAjustado | null = null

  for (const escala of ESCALAS_CORPO) {
    const tamanho = CORPO.tamanho * escala
    const entrelinha = CORPO.tamanho * CORPO.entrelinha * escala
    const fonte = (negrito: boolean) => fonteOutfit(tamanho, negrito)

    const medir = (texto: string, negrito: boolean) => {
      ctx.font = fonte(negrito)
      return ctx.measureText(texto).width
    }
    const blocos = blocosDeTexto.map((bloco) => quebrarBloco(bloco, CONTEUDO.largura, medir))

    ctx.font = fonte(false)
    // Com textBaseline 'top' a tinta começa abaixo do y pedido, e o ascent vem
    // negativo justamente com essa distância.
    const recuoTinta = -ctx.measureText('A').actualBoundingBoxAscent
    const descida = ctx.measureText('Sg').actualBoundingBoxDescent
    const y = baseTitulo + GAP_TITULO_CORPO - recuoTinta

    const linhas = blocos.reduce((soma, bloco) => soma + bloco.length, 0)
    ultimo = { blocos, entrelinha, fonte, y }

    if (y + (linhas - 1) * entrelinha + descida <= LIMITE_CORPO) break
  }

  // Se nem o menor degrau coubesse, sai o menor mesmo — uma copy nova longa
  // demais é problema de texto, não motivo para não gerar a imagem.
  if (!ultimo) throw new Error('ESCALAS_CORPO está vazio.')
  return ultimo
}

function desenharConteudo(ctx: CanvasRenderingContext2D, anos: number, nome: string): void {
  // 'top' porque aqui o texto flui para baixo a partir do padding do shape;
  // o Título 1, ancorado na base, usa 'alphabetic'.
  ctx.textBaseline = 'top'

  const fonteT2 = (negrito: boolean) => fonteOutfit(TITULO_2.tamanho, negrito)

  ctx.font = fonteT2(true)
  const medirT2 = (texto: string) => ctx.measureText(texto).width
  const linhasT2 = quebrarBloco(
    [{ texto: titulo2(anos), negrito: true }],
    CONTEUDO.largura,
    medirT2,
  )
  const entrelinhaT2 = TITULO_2.tamanho * TITULO_2.entrelinha
  const yTitulo2 = CONTEUDO.y + TITULO_2.recuoTopo

  ctx.fillStyle = gradiente135(ctx, {
    x: CONTEUDO.x,
    y: yTitulo2,
    largura: larguraMaxima(ctx, linhasT2, fonteT2),
    altura: linhasT2.length * entrelinhaT2,
  })
  desenharLinhas(ctx, linhasT2, CONTEUDO.x, yTitulo2, entrelinhaT2, fonteT2)

  // O gap de 20px separa as caixas de tinta, como o Canva empilha os elementos,
  // e não as caixas de linha. Por isso a posição do corpo sai das métricas reais
  // do texto desenhado, não da altura nominal da linha.
  ctx.font = fonteT2(true)
  const baseTitulo =
    yTitulo2 +
    (linhasT2.length - 1) * entrelinhaT2 +
    ctx.measureText(titulo2(anos)).actualBoundingBoxDescent

  const ajustado = ajustarCorpo(ctx, anos, nome, baseTitulo)

  ctx.fillStyle = CORPO.cor
  let y = ajustado.y
  for (const blocoDeLinhas of ajustado.blocos) {
    desenharLinhas(ctx, blocoDeLinhas, CONTEUDO.x, y, ajustado.entrelinha, ajustado.fonte)
    y += blocoDeLinhas.length * ajustado.entrelinha
  }
}
