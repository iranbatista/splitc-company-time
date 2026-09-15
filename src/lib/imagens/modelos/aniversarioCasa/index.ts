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
  GAP_TITULO_CORPO,
  LOGO,
  RAIO_SHAPE,
  SHAPE,
  TAMANHO,
  TITULO_1,
  TITULO_2,
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
import type { Modelo } from '@/lib/imagens/tipos'

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

function desenharConteudo(ctx: CanvasRenderingContext2D, anos: number, nome: string): void {
  // 'top' porque aqui o texto flui para baixo a partir do padding do shape;
  // o Título 1, ancorado na base, usa 'alphabetic'.
  ctx.textBaseline = 'top'

  const fonteT2 = (negrito: boolean) => fonteOutfit(TITULO_2.tamanho, negrito)
  const fonteCorpo = (negrito: boolean) => fonteOutfit(CORPO.tamanho, negrito)

  ctx.font = fonteT2(true)
  const medirT2 = (texto: string) => ctx.measureText(texto).width
  const linhasT2 = quebrarBloco(
    [{ texto: titulo2(anos), negrito: true }],
    CONTEUDO.largura,
    medirT2,
  )
  const entrelinhaT2 = TITULO_2.tamanho * TITULO_2.entrelinha

  ctx.fillStyle = gradiente135(ctx, {
    x: CONTEUDO.x,
    y: CONTEUDO.y,
    largura: larguraMaxima(ctx, linhasT2, fonteT2),
    altura: linhasT2.length * entrelinhaT2,
  })
  desenharLinhas(ctx, linhasT2, CONTEUDO.x, CONTEUDO.y, entrelinhaT2, fonteT2)

  let y = CONTEUDO.y + linhasT2.length * entrelinhaT2 + GAP_TITULO_CORPO
  const entrelinhaCorpo = CORPO.tamanho * CORPO.entrelinha

  ctx.fillStyle = CORPO.cor
  for (const bloco of corpo(anos, nome)) {
    const medir = (texto: string, negrito: boolean) => {
      ctx.font = fonteCorpo(negrito)
      return ctx.measureText(texto).width
    }
    const linhas = quebrarBloco(bloco, CONTEUDO.largura, medir)
    desenharLinhas(ctx, linhas, CONTEUDO.x, y, entrelinhaCorpo, fonteCorpo)
    y += linhas.length * entrelinhaCorpo
  }
}
