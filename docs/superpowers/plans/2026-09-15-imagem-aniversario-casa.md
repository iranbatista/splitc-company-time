# Geração de imagens — aniversário de casa — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um botão "Baixar imagem" em cada `PersonCard` gera e baixa o PNG 1200x627 de aniversário de casa da pessoa.

**Architecture:** Um motor genérico de geração em Canvas 2D (`src/lib/imagens/`) que não conhece nenhuma arte, mais um *modelo* plugável por arte (`src/lib/imagens/modelos/aniversarioCasa/`). O motor carrega os recursos que o modelo declara, cria o canvas no tamanho dele e delega o desenho. Arte nova = uma pasta e uma linha no registro, sem tocar no motor, no hook nem no download.

**Tech Stack:** React 18, TypeScript estrito (`verbatimModuleSyntax`), Vite 6, Canvas 2D nativo, Vitest, `@fontsource/dm-serif-display`.

**Spec:** `docs/superpowers/specs/2026-09-15-imagem-aniversario-casa-design.md`

---

## Convenções deste repositório

Leia antes de começar:

- Código e comentários em português; mensagens de commit em inglês.
- `verbatimModuleSyntax` está ligado: importe tipos com `import type { X } from '...'`, sempre. Sem isso o build quebra.
- `noUnusedLocals` e `noUnusedParameters` estão ligados: nada de variável sobrando.
- Alias `@/` aponta para `src/`.
- Comentários explicam *por que*, não *o que*. Veja `src/lib/aniversario.ts` como referência de tom.
- Commits em Conventional Commits, com a linha de co-autoria ao final:
  `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/imagens/tipos.ts` | `Caixa`, `Trecho`, `Bloco`, `Linha`, `Recursos`, `Modelo<P>` |
| `src/lib/imagens/medidas.ts` | Quebra de linha pura, com medidor injetado |
| `src/lib/imagens/medidas.test.ts` | Testes da quebra |
| `src/lib/imagens/canvas.ts` | `recorteCover`, `coverEm`, `caixaArredondada`, `gradiente135`, `desenharLinhas` |
| `src/lib/imagens/canvas.test.ts` | Teste da matemática do cover |
| `src/lib/imagens/recursos.ts` | Cache de imagens e fontes |
| `src/lib/imagens/download.ts` | `baixarBlob` |
| `src/lib/imagens/gerar.ts` | `gerarImagem(modelo, params)` |
| `src/lib/imagens/registro.ts` | Modelos indexados por id |
| `src/lib/imagens/modelos/aniversarioCasa/textos.ts` | Copy de 1 a 7 anos, `primeiroNome`, `temCopy` |
| `src/lib/imagens/modelos/aniversarioCasa/textos.test.ts` | Testes da copy |
| `src/lib/imagens/modelos/aniversarioCasa/layout.ts` | Geometria e tipografia da arte |
| `src/lib/imagens/modelos/aniversarioCasa/index.ts` | O `Modelo` |
| `src/hooks/useGerarImagem.ts` | Estado `ocioso \| gerando \| erro` e orquestração |
| `src/components/PersonCard.tsx` | Ganha o botão |
| `preview.html` + `src/preview.tsx` | Página de conferência visual, só em dev |
| `docs/referencias/aniversario-casa.png` | Export do Canva, a referência a bater |
| `vitest.config.ts` | Config do runner |

---

### Task 1: Dependências e runner de testes

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Instalar as dependências**

```bash
npm install @fontsource/dm-serif-display
npm install -D vitest
```

`@fontsource/dm-serif-display` traz o DM Serif Display italic servido do bundle. A spec exige fonte local: com CDN externa, uma falha de rede faz o canvas desenhar em fonte de fallback sem nenhum aviso.

- [ ] **Step 2: Criar `vitest.config.ts`**

```ts
import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Config separada de propósito: o vite.config.ts carrega env do Notion e
// valida API_BASE, coisas que não têm nada a ver com rodar teste de módulo
// puro. Quando existe vitest.config.ts, o Vitest ignora o vite.config.ts.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: Adicionar o script de teste**

Em `package.json`, dentro de `"scripts"`, logo depois de `"typecheck"`:

```json
    "test": "vitest run"
```

- [ ] **Step 4: Verificar que o runner sobe**

Run: `npx vitest run --passWithNoTests`
Expected: sai com código 0 e imprime `No test files found` (ainda não há testes).

- [ ] **Step 5: Versionar os assets da arte**

`public/background.png` e `public/logo.png` ainda estão fora do git. O browser
os busca em tempo de execução, então sem eles versionados o deploy do GitHub
Pages gera imagem quebrada.

Run: `git status --short public`
Expected: as duas linhas aparecem como `??`.

Mova também a referência exportada do Canva para um lugar estável, fora da raiz:

```bash
mkdir -p docs/referencias
git mv --force "Aniversário de casa.png" docs/referencias/aniversario-casa.png 2>/dev/null \
  || mv "Aniversário de casa.png" docs/referencias/aniversario-casa.png
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts public/background.png public/logo.png docs/referencias/aniversario-casa.png
git commit -m "chore: Add Vitest and the DM Serif Display font

Vitest gets its own config file because vite.config.ts loads Notion env vars
and validates API_BASE, neither of which has anything to do with running pure
module tests.

The font ships from the bundle rather than a CDN: when a webfont fails to load,
canvas silently falls back to a system font and the image comes out wrong with
no error anywhere.

Also tracks the art assets, which were sitting untracked: the browser fetches
them at runtime, so an untracked background means a broken image on Pages. The
Canva export moves to docs/referencias/ as the reference to render against.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Tipos do motor

**Files:**
- Create: `src/lib/imagens/tipos.ts`

Task sem teste: é só declaração de tipo, não há comportamento para testar. O primeiro uso real vem na Task 3.

- [ ] **Step 1: Criar `src/lib/imagens/tipos.ts`**

```ts
/**
 * Contratos do motor de geração de imagem. Nada aqui conhece nenhuma arte
 * específica — o motor só sabe carregar recursos, criar o canvas e delegar.
 */

export interface Caixa {
  x: number
  y: number
  largura: number
  altura: number
}

/** Pedaço de texto com peso próprio. É o que permite o nome em negrito no meio da frase. */
export interface Trecho {
  texto: string
  negrito: boolean
}

/**
 * Um bloco é uma linha lógica do texto, que ainda será quebrada conforme a
 * largura disponível. Bloco vazio (`[]`) é uma linha em branco — é assim que
 * a separação entre parágrafos atravessa a quebra sem caso especial.
 */
export type Bloco = Trecho[]

/** Linha já quebrada, pronta para desenhar. */
export type Linha = Trecho[]

export interface Recursos {
  imagens: Map<string, HTMLImageElement>
}

/**
 * Uma arte. Para adicionar a próxima, crie uma pasta em `modelos/` que exporte
 * um `Modelo` e registre em `registro.ts`. O motor não muda.
 */
export interface Modelo<P> {
  id: string
  /** Rótulo humano, para quando existir uma UI de escolha de arte. */
  nome: string
  tamanho: { largura: number; altura: number }
  /** URLs de imagem a pré-carregar antes do desenho. */
  imagens: string[]
  /** Specs de fonte no formato do `ctx.font`, para o `document.fonts.load`. */
  fontes: string[]
  /** `true`, ou o motivo (exibível) de a arte não valer para esses params. */
  aplicavel(params: P): true | string
  nomeArquivo(params: P): string
  desenhar(ctx: CanvasRenderingContext2D, params: P, recursos: Recursos): void
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npm run typecheck`
Expected: sai sem erro.

- [ ] **Step 3: Commit**

```bash
git add src/lib/imagens/tipos.ts
git commit -m "feat: Add the image engine contracts

Defines Modelo<P>, the seam that keeps the engine ignorant of any particular
art. More arts are planned, so the engine loads what a model declares and
delegates the drawing.

aplicavel() returns either true or the human-readable reason the art does not
apply, which is what lets each model own its own availability rule without the
card component knowing anything about it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Quebra de linha (TDD)

**Files:**
- Create: `src/lib/imagens/medidas.ts`
- Test: `src/lib/imagens/medidas.test.ts`

A quebra é pura: recebe um medidor injetado em vez de um `ctx`. É o que torna a parte mais delicada do render testável sem browser.

- [ ] **Step 1: Escrever os testes que falham**

Create `src/lib/imagens/medidas.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { quebrarBloco } from '@/lib/imagens/medidas'
import type { Bloco } from '@/lib/imagens/tipos'

/** Medidor determinístico: 10px por caractere, sem diferença por peso. */
const medir = (texto: string) => texto.length * 10

/** Achata uma linha em string, para asserções legíveis. */
const texto = (linha: { texto: string }[]) => linha.map((t) => t.texto).join('')

describe('quebrarBloco', () => {
  it('mantém em uma linha o que cabe', () => {
    const bloco: Bloco = [{ texto: 'um dois', negrito: false }]
    const linhas = quebrarBloco(bloco, 200, medir)
    expect(linhas.map(texto)).toEqual(['um dois'])
  })

  it('quebra na última palavra que cabe', () => {
    const bloco: Bloco = [{ texto: 'um dois tres', negrito: false }]
    // 'um dois' = 70px; 'um dois tres' = 120px. Com 100 de largura, quebra.
    const linhas = quebrarBloco(bloco, 100, medir)
    expect(linhas.map(texto)).toEqual(['um dois', 'tres'])
  })

  it('devolve uma linha vazia para bloco vazio', () => {
    expect(quebrarBloco([], 100, medir)).toEqual([[]])
  })

  it('não junta a palavra ao trecho seguinte quando ele começa com pontuação', () => {
    const bloco: Bloco = [
      { texto: 'Mel', negrito: true },
      { texto: ', obrigada', negrito: false },
    ]
    const linhas = quebrarBloco(bloco, 1000, medir)
    expect(linhas).toHaveLength(1)
    expect(texto(linhas[0])).toBe('Mel, obrigada')
    expect(linhas[0]).toEqual([
      { texto: 'Mel', negrito: true },
      { texto: ', obrigada', negrito: false },
    ])
  })

  it('preserva o negrito quando a quebra cai depois da palavra em destaque', () => {
    const bloco: Bloco = [
      { texto: 'oi ', negrito: false },
      { texto: 'Mel', negrito: true },
      { texto: ' tudo bem', negrito: false },
    ]
    // 'oi Mel' = 60px, cabe; ' tudo' estouraria 80.
    const linhas = quebrarBloco(bloco, 80, medir)
    expect(linhas.map(texto)).toEqual(['oi Mel', 'tudo bem'])
    expect(linhas[0][1]).toEqual({ texto: 'Mel', negrito: true })
  })

  it('funde trechos vizinhos de mesmo peso em um só', () => {
    const bloco: Bloco = [
      { texto: 'um ', negrito: false },
      { texto: 'dois', negrito: false },
    ]
    const linhas = quebrarBloco(bloco, 1000, medir)
    expect(linhas[0]).toEqual([{ texto: 'um dois', negrito: false }])
  })

  it('deixa a palavra maior que a caixa em uma linha só, transbordando', () => {
    const bloco: Bloco = [{ texto: 'a interminavelmente b', negrito: false }]
    const linhas = quebrarBloco(bloco, 50, medir)
    expect(linhas.map(texto)).toEqual(['a', 'interminavelmente', 'b'])
  })
})
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npx vitest run src/lib/imagens/medidas.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/imagens/medidas"`.

- [ ] **Step 3: Implementar `src/lib/imagens/medidas.ts`**

```ts
import type { Bloco, Linha, Trecho } from '@/lib/imagens/tipos'

/** Largura de um texto em pixels, no peso dado. Injetado para manter este módulo puro. */
export type Medidor = (texto: string, negrito: boolean) => number

/**
 * Uma palavra pode atravessar trechos de pesos diferentes ('Mel' em negrito
 * seguido de ', obrigada' regular formam a palavra 'Mel,'), então a unidade de
 * quebra é uma lista de trechos, não uma string.
 */
type Palavra = Trecho[]

/**
 * Separa em palavras pelo espaço em branco do texto concatenado. Fatiar trecho
 * a trecho quebraria 'Mel' e ',' em palavras diferentes e a vírgula desceria
 * sozinha para a linha de baixo.
 */
function emPalavras(bloco: Bloco): Palavra[] {
  const palavras: Palavra[] = []
  let atual: Palavra = []

  const fechar = () => {
    if (atual.length > 0) {
      palavras.push(atual)
      atual = []
    }
  }

  for (const trecho of bloco) {
    for (const parte of trecho.texto.split(/(\s+)/)) {
      if (parte === '') continue
      if (/^\s+$/.test(parte)) {
        fechar()
        continue
      }
      atual.push({ texto: parte, negrito: trecho.negrito })
    }
  }
  fechar()

  return palavras
}

function largura(palavra: Palavra, medir: Medidor): number {
  return palavra.reduce((soma, trecho) => soma + medir(trecho.texto, trecho.negrito), 0)
}

/** Vizinhos de mesmo peso viram um trecho só: menos trocas de fonte no desenho. */
function fundir(trechos: Trecho[]): Linha {
  const saida: Trecho[] = []
  for (const trecho of trechos) {
    const ultimo = saida[saida.length - 1]
    if (ultimo && ultimo.negrito === trecho.negrito) {
      ultimo.texto += trecho.texto
    } else {
      saida.push({ ...trecho })
    }
  }
  return saida
}

/**
 * Quebra um bloco na largura disponível. Palavra mais larga que a caixa fica
 * sozinha na linha e transborda — hifenizar seria pior num texto de marca.
 *
 * Bloco vazio devolve uma linha vazia, e não nenhuma: é o que faz a linha em
 * branco entre parágrafos ocupar altura como qualquer outra.
 */
export function quebrarBloco(bloco: Bloco, larguraMax: number, medir: Medidor): Linha[] {
  const palavras = emPalavras(bloco)
  if (palavras.length === 0) return [[]]

  const espaco = medir(' ', false)
  const linhas: Linha[] = []
  let atual: Trecho[] = []
  let acumulada = 0

  for (const palavra of palavras) {
    const larguraPalavra = largura(palavra, medir)

    if (atual.length === 0) {
      atual = [...palavra]
      acumulada = larguraPalavra
      continue
    }

    if (acumulada + espaco + larguraPalavra > larguraMax) {
      linhas.push(fundir(atual))
      atual = [...palavra]
      acumulada = larguraPalavra
      continue
    }

    // O espaço entra sempre como regular: é medido assim, e um espaço em
    // negrito não muda nada visualmente.
    atual.push({ texto: ' ', negrito: false }, ...palavra)
    acumulada += espaco + larguraPalavra
  }

  linhas.push(fundir(atual))

  return linhas
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/lib/imagens/medidas.test.ts`
Expected: PASS, 7 testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/imagens/medidas.ts src/lib/imagens/medidas.test.ts
git commit -m "feat: Add pure line breaking for canvas text

The measurer is injected rather than taken from a canvas context, so the
trickiest part of the render is testable without a browser.

Words are split on whitespace in the concatenated text, not per run: splitting
run by run would put the bold first name and the comma that follows it in
different words, and the comma would wrap onto the next line by itself.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Primitivas de canvas (TDD na parte pura)

**Files:**
- Create: `src/lib/imagens/canvas.ts`
- Test: `src/lib/imagens/canvas.test.ts`

Só `recorteCover` é testado: é a única conta não trivial. O resto é chamada direta de API do canvas, validada na conferência visual da Task 9.

- [ ] **Step 1: Escrever o teste que falha**

Create `src/lib/imagens/canvas.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { recorteCover } from '@/lib/imagens/canvas'

describe('recorteCover', () => {
  it('recorta as laterais quando o destino é mais alto em proporção', () => {
    // O shape da arte: 662x475 a partir de uma imagem 1200x627.
    // escala = max(662/1200, 475/627) = 0.7576 -> recorte de 874x627.
    const recorte = recorteCover({ largura: 1200, altura: 627 }, { largura: 662, altura: 475 })
    expect(recorte.sh).toBeCloseTo(627, 3)
    expect(recorte.sw).toBeCloseTo(873.86, 1)
    expect(recorte.sy).toBeCloseTo(0, 3)
    expect(recorte.sx).toBeCloseTo(163.07, 1)
  })

  it('recorta o topo e a base quando o destino é mais largo em proporção', () => {
    const recorte = recorteCover({ largura: 100, altura: 100 }, { largura: 200, altura: 100 })
    expect(recorte.sw).toBeCloseTo(100, 3)
    expect(recorte.sh).toBeCloseTo(50, 3)
    expect(recorte.sx).toBeCloseTo(0, 3)
    expect(recorte.sy).toBeCloseTo(25, 3)
  })

  it('não recorta nada quando as proporções são iguais', () => {
    const recorte = recorteCover({ largura: 1200, altura: 627 }, { largura: 600, altura: 313.5 })
    expect(recorte).toEqual({ sx: 0, sy: 0, sw: 1200, sh: 627 })
  })
})
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npx vitest run src/lib/imagens/canvas.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/imagens/canvas"`.

- [ ] **Step 3: Implementar `src/lib/imagens/canvas.ts`**

```ts
import type { Caixa, Linha } from '@/lib/imagens/tipos'

/** Stops da marca, na ordem do gradiente. */
const STOPS_MARCA: readonly [number, string][] = [
  [0, '#f7a205'],
  [0.5, '#f07f16'],
  [1, '#ea5518'],
]

export interface Recorte {
  sx: number
  sy: number
  sw: number
  sh: number
}

/**
 * Região da imagem de origem que preenche o destino sem distorcer, centrada —
 * o mesmo que `object-fit: cover`.
 */
export function recorteCover(
  origem: { largura: number; altura: number },
  destino: { largura: number; altura: number },
): Recorte {
  const escala = Math.max(destino.largura / origem.largura, destino.altura / origem.altura)
  const sw = destino.largura / escala
  const sh = destino.altura / escala
  return {
    sx: (origem.largura - sw) / 2,
    sy: (origem.altura - sh) / 2,
    sw,
    sh,
  }
}

export function coverEm(ctx: CanvasRenderingContext2D, img: HTMLImageElement, caixa: Caixa): void {
  const { sx, sy, sw, sh } = recorteCover(
    { largura: img.naturalWidth, altura: img.naturalHeight },
    caixa,
  )
  ctx.drawImage(img, sx, sy, sw, sh, caixa.x, caixa.y, caixa.largura, caixa.altura)
}

/** Abre o caminho do retângulo arredondado. Quem chama decide entre `clip()` e `fill()`. */
export function caixaArredondada(ctx: CanvasRenderingContext2D, caixa: Caixa, raio: number): void {
  ctx.beginPath()
  ctx.roundRect(caixa.x, caixa.y, caixa.largura, caixa.altura, raio)
}

/**
 * Gradiente da marca no eixo do canto superior esquerdo ao inferior direito da
 * caixa. É a leitura do `linear-gradient(135deg, ...)` do CSS aplicada à caixa
 * do próprio texto, e não à imagem inteira: é assim que o Canva desenha.
 */
export function gradiente135(ctx: CanvasRenderingContext2D, caixa: Caixa): CanvasGradient {
  const gradiente = ctx.createLinearGradient(
    caixa.x,
    caixa.y,
    caixa.x + caixa.largura,
    caixa.y + caixa.altura,
  )
  for (const [posicao, cor] of STOPS_MARCA) {
    gradiente.addColorStop(posicao, cor)
  }
  return gradiente
}

/**
 * Desenha linhas já quebradas. `fillStyle` é responsabilidade de quem chama —
 * é o que permite a mesma função servir ao texto branco e ao com gradiente.
 */
export function desenharLinhas(
  ctx: CanvasRenderingContext2D,
  linhas: Linha[],
  x: number,
  yInicial: number,
  entrelinha: number,
  fonte: (negrito: boolean) => string,
): void {
  linhas.forEach((linha, indice) => {
    const y = yInicial + indice * entrelinha
    let cursor = x
    for (const trecho of linha) {
      ctx.font = fonte(trecho.negrito)
      ctx.fillText(trecho.texto, cursor, y)
      cursor += ctx.measureText(trecho.texto).width
    }
  })
}

/** Largura da linha mais larga, para dimensionar a caixa do gradiente. */
export function larguraMaxima(
  ctx: CanvasRenderingContext2D,
  linhas: Linha[],
  fonte: (negrito: boolean) => string,
): number {
  let maior = 0
  for (const linha of linhas) {
    let soma = 0
    for (const trecho of linha) {
      ctx.font = fonte(trecho.negrito)
      soma += ctx.measureText(trecho.texto).width
    }
    maior = Math.max(maior, soma)
  }
  return maior
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/lib/imagens/canvas.test.ts`
Expected: PASS, 3 testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/imagens/canvas.ts src/lib/imagens/canvas.test.ts
git commit -m "feat: Add canvas drawing primitives shared by every art

Cover cropping, rounded boxes, the brand gradient and rich-text line drawing are
what any piece of this brand repeats, so they live in the engine rather than in
the anniversary model.

Only the cover math is unit tested; the rest is a thin pass-through to the
canvas API and is validated by comparing a render against the reference export.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Carregamento de recursos, download e geração

**Files:**
- Create: `src/lib/imagens/recursos.ts`
- Create: `src/lib/imagens/download.ts`
- Create: `src/lib/imagens/gerar.ts`

Tudo aqui depende de DOM e de rede. Sem teste unitário: um teste desses só exercitaria mocks. A validação real é a Task 9.

- [ ] **Step 1: Criar `src/lib/imagens/recursos.ts`**

```ts
/**
 * Cache de recursos por URL e por spec de fonte. O background tem 1,5MB: ele é
 * buscado no primeiro clique e nunca no carregamento da lista.
 */

const imagens = new Map<string, Promise<HTMLImageElement>>()
const fontes = new Map<string, Promise<void>>()

/**
 * Amostra com acentos e reticências. Fontes servidas em subsets só baixam o
 * arquivo que cobre os caracteres pedidos; pedir só 'abc' carregaria um subset
 * sem 'á' e o canvas desenharia esses glifos em fallback.
 */
const AMOSTRA = 'AÁÊÇãõéíóúº… 0123456789'

export function carregarImagem(url: string): Promise<HTMLImageElement> {
  const emCache = imagens.get(url)
  if (emCache) return emCache

  const promessa = new Promise<HTMLImageElement>((resolver, rejeitar) => {
    const img = new Image()
    img.onload = () => resolver(img)
    img.onerror = () => rejeitar(new Error(`Não foi possível carregar a imagem ${url}.`))
    img.src = url
  })

  // Falha não fica no cache: o próximo clique tenta de novo.
  promessa.catch(() => imagens.delete(url))
  imagens.set(url, promessa)

  return promessa
}

export function carregarFonte(spec: string): Promise<void> {
  const emCache = fontes.get(spec)
  if (emCache) return emCache

  const promessa = document.fonts.load(spec, AMOSTRA).then((encontradas) => {
    // Lista vazia significa que nenhuma face bate com o spec — provavelmente o
    // @fontsource não foi importado. Sem esse erro, o canvas desenharia em
    // fonte de sistema e a imagem sairia errada sem nenhum aviso.
    if (encontradas.length === 0) {
      throw new Error(`Fonte não encontrada: ${spec}.`)
    }
  })

  promessa.catch(() => fontes.delete(spec))
  fontes.set(spec, promessa)

  return promessa
}
```

- [ ] **Step 2: Criar `src/lib/imagens/download.ts`**

```ts
/** Dispara o download de um blob com o nome dado. */
export function baixarBlob(blob: Blob, nomeArquivo: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revogar na mesma volta do event loop aborta o download no Firefox.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
```

- [ ] **Step 3: Criar `src/lib/imagens/gerar.ts`**

```ts
import { carregarFonte, carregarImagem } from '@/lib/imagens/recursos'
import type { Modelo } from '@/lib/imagens/tipos'

/**
 * Cria o canvas no tamanho do modelo, garante que recursos e fontes estão
 * prontos e delega o desenho. Não conhece nenhuma arte.
 */
export async function gerarImagem<P>(modelo: Modelo<P>, params: P): Promise<Blob> {
  const motivo = modelo.aplicavel(params)
  if (motivo !== true) throw new Error(motivo)

  const [carregadas] = await Promise.all([
    Promise.all(
      modelo.imagens.map(async (url) => [url, await carregarImagem(url)] as const),
    ),
    // As fontes precisam estar prontas ANTES do primeiro fillText: o canvas não
    // re-renderiza quando a fonte chega depois.
    Promise.all(modelo.fontes.map(carregarFonte)),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = modelo.tamanho.largura
  canvas.height = modelo.tamanho.altura

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponível neste navegador.')

  modelo.desenhar(ctx, params, { imagens: new Map(carregadas) })

  const blob = await new Promise<Blob | null>((resolver) => {
    canvas.toBlob(resolver, 'image/png')
  })
  if (!blob) throw new Error('Não foi possível gerar o PNG.')

  return blob
}
```

- [ ] **Step 4: Verificar que compila**

Run: `npm run typecheck`
Expected: sai sem erro.

- [ ] **Step 5: Commit**

```bash
git add src/lib/imagens/recursos.ts src/lib/imagens/download.ts src/lib/imagens/gerar.ts
git commit -m "feat: Add resource loading, blob download and the generator

Fonts are awaited before the first fillText because canvas does not re-render
when a webfont arrives late; the image would simply come out in a fallback face
with nothing logged. An empty result from document.fonts.load is treated as an
error for the same reason.

The 1.5MB background is fetched on the first click and cached per URL, so the
list view never pays for it. Failures are evicted from the cache so the next
click retries.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Copy do aniversário (TDD)

**Files:**
- Create: `src/lib/imagens/modelos/aniversarioCasa/textos.ts`
- Test: `src/lib/imagens/modelos/aniversarioCasa/textos.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Create `src/lib/imagens/modelos/aniversarioCasa/textos.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  TITULO_1,
  corpo,
  primeiroNome,
  temCopy,
  titulo2,
} from '@/lib/imagens/modelos/aniversarioCasa/textos'

describe('primeiroNome', () => {
  it('pega a primeira palavra', () => {
    expect(primeiroNome('Mel Ferreira Lima')).toBe('Mel')
  })

  it('ignora espaços nas pontas e repetidos', () => {
    expect(primeiroNome('  Ana   Paula  ')).toBe('Ana')
  })

  it('devolve string vazia para nome vazio', () => {
    expect(primeiroNome('   ')).toBe('')
  })
})

describe('temCopy', () => {
  it('cobre de 1 a 7 anos', () => {
    expect([1, 2, 3, 4, 5, 6, 7].every(temCopy)).toBe(true)
  })

  it('não cobre 0 nem 8', () => {
    expect(temCopy(0)).toBe(false)
    expect(temCopy(8)).toBe(false)
  })

  it('não cobre não-inteiro', () => {
    expect(temCopy(1.5)).toBe(false)
  })
})

describe('titulo2', () => {
  it('interpola o número de anos', () => {
    expect(titulo2(7)).toBe('Parabéns pelo seu 7º ano na SplitC!')
  })
})

describe('TITULO_1', () => {
  it('é o texto da arte', () => {
    expect(TITULO_1).toBe('Aniversário de empresa')
  })
})

describe('corpo', () => {
  it('marca o primeiro nome como negrito e o resto como regular', () => {
    const blocos = corpo(1, 'Mel')
    const trechos = blocos.flat()
    const negritos = trechos.filter((t) => t.negrito)
    expect(negritos).toEqual([{ texto: 'Mel', negrito: true }])
  })

  it('abre o texto de 1 ano com o nome', () => {
    const [primeiro] = corpo(1, 'Mel')
    expect(primeiro[0]).toEqual({ texto: 'Mel', negrito: true })
    expect(primeiro[1].texto).toMatch(/^, há um ano/)
  })

  it('põe o nome no meio do segundo parágrafo em 2 anos', () => {
    const blocos = corpo(2, 'Mel')
    expect(blocos[0].some((t) => t.negrito)).toBe(false)
    expect(blocos[2][0]).toEqual({ texto: 'Mel', negrito: true })
  })

  it('separa parágrafos com um bloco vazio', () => {
    const blocos = corpo(1, 'Mel')
    expect(blocos[1]).toEqual([])
  })

  it('termina com a assinatura em duas linhas', () => {
    const blocos = corpo(7, 'Mel')
    const ultimos = blocos.slice(-2).map((bloco) => bloco.map((t) => t.texto).join(''))
    expect(ultimos).toEqual(['Com carinho,', 'SplitC'])
  })

  it('nunca deixa o marcador cru passar', () => {
    for (let anos = 1; anos <= 7; anos += 1) {
      const texto = corpo(anos, 'Mel')
        .map((bloco) => bloco.map((t) => t.texto).join(''))
        .join('\n')
      expect(texto).not.toContain('{nome}')
      expect(texto).toContain('Mel')
    }
  })

  it('lança para ano sem copy', () => {
    expect(() => corpo(8, 'Mel')).toThrow()
  })
})
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npx vitest run src/lib/imagens/modelos/aniversarioCasa/textos.test.ts`
Expected: FAIL — `Failed to resolve import ".../textos"`.

- [ ] **Step 3: Implementar `src/lib/imagens/modelos/aniversarioCasa/textos.ts`**

```ts
import type { Bloco } from '@/lib/imagens/tipos'

export const TITULO_1 = 'Aniversário de empresa'

export function titulo2(anos: number): string {
  return `Parabéns pelo seu ${anos}º ano na SplitC!`
}

export const ANOS_MIN = 1
export const ANOS_MAX = 7

/**
 * Os textos ficam como template com o marcador `{nome}`; `corpo()` os converte
 * em blocos de trechos. Escrever as sete copies já como array aninhado seria
 * ilegível e fácil de errar — o marcador nunca sai daqui.
 *
 * Uma quebra de linha simples é uma linha nova; a linha em branco entre
 * parágrafos vira um bloco vazio, que ocupa altura como qualquer outra linha.
 */
const TEMPLATES: Record<number, string> = {
  1: `{nome}, há um ano você topou fazer parte dessa jornada. Entre aprendizados, novidades e muitos desafios, você começou a construir a sua história por aqui e deu os primeiros passos vivendo a nossa cultura.

Obrigada por fazer parte do nosso time e por se mover rápido desde o primeiro dia. Esse é só o começo da sua jornada!

Com carinho,
SplitC`,

  2: `Em dois anos, muita coisa muda. Hoje você já conhece nossos desafios, ajuda a encontrar caminhos e faz parte das decisões que movem a SplitC todos os dias.

{nome}, obrigada por fazer parte do nosso time e por demonstrar ownership em tudo o que faz. Que venham muitos anos construindo essa história com a gente!

Com carinho,
SplitC`,

  3: `Três anos representam uma trajetória de evolução constante. Você acompanhou mudanças, compartilhou conhecimento e ajudou a elevar o nível do nosso time com a busca por excelência.

{nome}, obrigada por fazer parte do nosso time e por crescer junto com a SplitC. Seu trabalho faz diferença todos os dias.

Com carinho,
SplitC`,

  4: `{nome}, ao longo desses quatro anos, você ajudou a construir relações, fortalecer nosso jeito de trabalhar e gerar impacto para quem mais importa: nossos clientes.

Obrigada por fazer parte do nosso time e por colocar o cliente no centro de cada entrega. É muito bom ter você construindo essa história com a gente.

Com carinho,
SplitC`,

  5: `Cinco anos é muita história pra contar. Você acompanhou mudanças, viu a SplitC crescer e, mais importante, ajudou a construir boa parte do que somos hoje.

{nome}, obrigada por fazer parte do nosso time e por viver nossos valores todos os dias, sempre com ownership, excelência e vontade de fazer acontecer. Bora pros próximos capítulos!

Com carinho,
SplitC`,

  6: `{nome}, seis anos não acontecem por acaso. É tempo de construir confiança, criar boas histórias e deixar sua marca por onde passa.

Obrigada por fazer parte do nosso time e por seguir se movendo rápido, buscando excelência e contribuindo para que nossos clientes tenham a melhor experiência. É muito bom ter você com a gente!

Com carinho,
SplitC`,

  7: `Sete anos... isso é muita coisa! Você acompanhou diferentes fases da SplitC, viu muita coisa mudar e fez parte de cada uma delas.

{nome}, obrigada por fazer parte do nosso time e por seguir construindo essa história com ownership, parceria e foco em fazer o melhor para nossos clientes. Que venham muitos anos pela frente!

Com carinho,
SplitC`,
}

export function temCopy(anos: number): boolean {
  return Number.isInteger(anos) && anos >= ANOS_MIN && anos <= ANOS_MAX
}

/** Primeira palavra do nome completo. */
export function primeiroNome(nome: string): string {
  const [primeira] = nome.trim().split(/\s+/)
  return primeira ?? ''
}

function emTrechos(linha: string, nome: string): Bloco {
  return linha
    .split('{nome}')
    .flatMap((parte, indice) =>
      indice === 0
        ? [{ texto: parte, negrito: false }]
        : [
            { texto: nome, negrito: true },
            { texto: parte, negrito: false },
          ],
    )
    .filter((trecho) => trecho.texto !== '')
}

/** Corpo do ano pedido, já com o nome em negrito no lugar do marcador. */
export function corpo(anos: number, nome: string): Bloco[] {
  const template = TEMPLATES[anos]
  if (!template) {
    throw new Error(`Não temos texto de aniversário para ${anos} anos de casa.`)
  }
  return template.split('\n').map((linha) => emTrechos(linha, nome))
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/lib/imagens/modelos/aniversarioCasa/textos.test.ts`
Expected: PASS, 13 testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/imagens/modelos/aniversarioCasa/textos.ts src/lib/imagens/modelos/aniversarioCasa/textos.test.ts
git commit -m "feat: Add the anniversary copy for one through seven years

The copy is stored as templates with a {nome} marker and converted to weighted
runs by corpo(); writing seven bodies as nested arrays by hand would be
unreadable and easy to get wrong. A test asserts the marker never survives into
the rendered text.

A single newline is a new line and a blank line becomes an empty block, so
paragraph spacing needs no special case in the renderer.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Geometria e o modelo

**Files:**
- Create: `src/lib/imagens/modelos/aniversarioCasa/layout.ts`
- Create: `src/lib/imagens/modelos/aniversarioCasa/index.ts`
- Create: `src/lib/imagens/registro.ts`

- [ ] **Step 1: Criar `src/lib/imagens/modelos/aniversarioCasa/layout.ts`**

```ts
import type { Caixa } from '@/lib/imagens/tipos'

export const TAMANHO = { largura: 1200, altura: 627 }

export const MARGEM = 63

/**
 * Os tamanhos de fonte vieram do Canva (39,5 / 25 / 18) e as unidades de lá não
 * são os pixels desta arte. Este fator veio de medir a altura de caixa alta na
 * referência exportada — é estimativa, conferida contra
 * `docs/referencias/aniversario-casa.png` na página /preview.html.
 */
export const ESCALA_CANVA = 1200 / 875

export const LOGO: Caixa = { x: MARGEM, y: MARGEM, largura: 177, altura: 66 }

/**
 * O `y` sai de `627 - 63 - 475`. A spec original dizia "63 do topo", o que não
 * fecha com 475 de altura em 627 de canvas; a referência confirma 89. Manda
 * base + altura.
 */
export const SHAPE: Caixa = {
  x: TAMANHO.largura - MARGEM - 662,
  y: TAMANHO.altura - MARGEM - 475,
  largura: 662,
  altura: 475,
}

export const RAIO_SHAPE = 32
export const PADDING_SHAPE = 40
export const GAP_TITULO_CORPO = 20

/** Área útil dentro do shape, já descontado o padding. */
export const CONTEUDO = {
  x: SHAPE.x + PADDING_SHAPE,
  y: SHAPE.y + PADDING_SHAPE,
  largura: SHAPE.largura - PADDING_SHAPE * 2,
}

export const TITULO_1 = {
  tamanho: 39.5 * ESCALA_CANVA,
  entrelinha: 1.3,
  x: MARGEM,
  /** Base da última linha: o bloco cresce para cima a partir daqui. */
  base: TAMANHO.altura - MARGEM,
  /** Vai da margem esquerda até a borda do shape. */
  larguraMax: SHAPE.x - MARGEM,
}

export const TITULO_2 = {
  tamanho: 25 * ESCALA_CANVA,
  entrelinha: 1.3,
}

export const CORPO = {
  tamanho: 18 * ESCALA_CANVA,
  entrelinha: 1.5,
  cor: '#ffffff',
}

export function fonteTitulo1(): string {
  return `italic 400 ${TITULO_1.tamanho}px "DM Serif Display", serif`
}

export function fonteOutfit(tamanho: number, negrito: boolean): string {
  return `${negrito ? 700 : 400} ${tamanho}px "Outfit Variable", sans-serif`
}

/** Servidos de `public/`, então o base path do Vite entra na URL. */
export const URL_BACKGROUND = `${import.meta.env.BASE_URL}background.png`
export const URL_LOGO = `${import.meta.env.BASE_URL}logo.png`
```

- [ ] **Step 2: Criar `src/lib/imagens/modelos/aniversarioCasa/index.ts`**

```ts
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
```

- [ ] **Step 3: Criar `src/lib/imagens/registro.ts`**

```ts
import { aniversarioCasa } from '@/lib/imagens/modelos/aniversarioCasa'

/**
 * Todas as artes disponíveis. Existe para o dia em que houver uma UI de
 * escolha; hoje cada ponto de uso importa o modelo concreto, que preserva a
 * tipagem dos params.
 */
export const MODELOS = {
  [aniversarioCasa.id]: aniversarioCasa,
}
```

- [ ] **Step 4: Verificar que compila**

Run: `npm run typecheck`
Expected: sai sem erro.

- [ ] **Step 5: Commit**

```bash
git add src/lib/imagens/modelos/aniversarioCasa/layout.ts src/lib/imagens/modelos/aniversarioCasa/index.ts src/lib/imagens/registro.ts
git commit -m "feat: Add the company anniversary art model

Geometry lives apart from the drawing so the numbers can be read against the
reference in one place. The shape's y is derived from base plus height: the
original spec said 63 from the top, which does not fit a 475px shape in a 627px
canvas, and the export confirms 89.

ESCALA_CANVA converts the Canva font sizes, whose units are not this art's
pixels. It is measured from the export and still needs confirming against it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Hook e botão no card

**Files:**
- Create: `src/hooks/useGerarImagem.ts`
- Modify: `src/components/PersonCard.tsx`

- [ ] **Step 1: Criar `src/hooks/useGerarImagem.ts`**

```ts
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
```

- [ ] **Step 2: Reescrever `src/components/PersonCard.tsx`**

```tsx
import { Avatar } from '@/components/Avatar'
import { useGerarImagem } from '@/hooks/useGerarImagem'
import { aniversarioCasa } from '@/lib/imagens/modelos/aniversarioCasa'
import type { Aniversariante } from '@/types/aniversariante'

interface PersonCardProps {
  pessoa: Aniversariante
}

const ROTULO: Record<string, string> = {
  ocioso: 'Baixar imagem',
  gerando: 'Gerando…',
  erro: 'Tentar de novo',
}

export function PersonCard({ pessoa }: PersonCardProps) {
  const { nome, setores, dia, anos, fotoUrl } = pessoa
  const { estado, gerar } = useGerarImagem(aniversarioCasa)

  const motivo = aniversarioCasa.aplicavel({ nome, anos })
  const indisponivel = motivo === true ? null : motivo

  return (
    <article className="surface flex flex-col items-center gap-4 p-6 text-center transition-colors hover:bg-[var(--wash)]">
      <Avatar nome={nome} fotoUrl={fotoUrl} />

      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 className="font-heading text-[1.0625rem] font-medium leading-snug tracking-tight text-[var(--ink)]">
          {nome}
        </h2>
        {setores.length > 0 && (
          <p className="eyebrow">{setores.join(' · ')}</p>
        )}
      </div>

      <div className="mt-auto flex flex-col items-center gap-2 pt-1">
        {/* Tinta suave em vez do gradiente cheio: com 20 cards na tela o
            gradiente por card gritaria. Ele fica reservado ao header. */}
        <span className="rounded-full border border-[var(--brand-from)]/35 bg-[var(--tint)] px-3.5 py-1 text-[0.8125rem] font-semibold text-[var(--brand-ink)]">
          {anos} {anos === 1 ? 'ano' : 'anos'} de casa
        </span>
        <span className="text-xs text-[var(--ink-muted)]">dia {dia}</span>

        <button
          type="button"
          onClick={() => void gerar({ nome, anos })}
          disabled={indisponivel !== null || estado === 'gerando'}
          title={indisponivel ?? undefined}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-[var(--hairline)] px-3.5 py-1.5 text-[0.8125rem] font-medium text-[var(--ink-muted)] transition-colors hover:bg-[var(--tint)] hover:text-[var(--brand-ink)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-[var(--ink-muted)]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <path d="M8 2v8m0 0 3-3m-3 3L5 7" />
            <path d="M2.5 11.5v1a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1" />
          </svg>
          {ROTULO[estado]}
        </button>
      </div>
    </article>
  )
}
```

- [ ] **Step 3: Verificar que compila**

Run: `npm run typecheck`
Expected: sai sem erro.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useGerarImagem.ts src/components/PersonCard.tsx
git commit -m "feat: Add a download button to each person card

The card asks the model whether the art applies and uses the returned reason as
the disabled button's tooltip, so the eight-years-and-up rule lives in the model
and not in the component.

Params go to gerar() rather than to the hook: passed at hook creation, a fresh
object every render would invalidate the callback continuously.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Página de conferência e ajuste da escala

**Files:**
- Create: `preview.html`
- Create: `src/preview.tsx`

Esta é a task que valida a estimativa de `ESCALA_CANVA` e as âncoras verticais. Nada disso está confirmado antes daqui.

A página fica no repositório: `vite build` só usa `index.html` como entrada, então ela não vai para produção, e a próxima arte vai precisar da mesma conferência.

- [ ] **Step 1: Criar `preview.html` na raiz do projeto**

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Conferência de imagens</title>
  </head>
  <body style="margin: 0; background: #1c1a18">
    <div id="root"></div>
    <script type="module" src="/src/preview.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Criar `src/preview.tsx`**

```tsx
/**
 * Página de conferência visual, só em dev: `vite build` tem index.html como
 * única entrada, então isto nunca vai para produção.
 *
 * Abra http://localhost:5173/preview.html e compare com a referência exportada
 * do Canva na raiz do repositório.
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
    gerarImagem(aniversarioCasa, { nome: 'Mel Ferreira', anos: 7 })
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
```

- [ ] **Step 3: Verificar que as fontes estão importadas na app também**

Em `src/index.css`, logo abaixo de `@import "@fontsource-variable/outfit";`, acrescentar:

```css
@import "@fontsource/dm-serif-display/400-italic.css";
```

Sem isso, a fonte existe só na página de preview e o botão do card falha com "Fonte não encontrada".

- [ ] **Step 4: Subir o dev server e comparar**

Run: `npm run dev`

Abra `http://localhost:5173/preview.html`. A imagem de cima é a gerada, a de baixo é a referência do Canva, ambas em 1200x627 — a comparação é rolar entre as duas.

Confira, nesta ordem:

1. **Tipografia.** Se os textos saírem sistematicamente maiores ou menores que a referência, ajuste `ESCALA_CANVA` em `layout.ts`. O valor de partida é `1200 / 875 ≈ 1.371`, estimado medindo a altura de caixa alta no export.
2. **Título 1.** Deve quebrar em "Aniversário de" / "empresa" e terminar a ~63px da base. Se estiver baixo demais, o problema é `TITULO_1.base` usar a linha de base onde deveria considerar o descendente do "p" de "empresa" — desconte a diferença medida.
3. **Corpo.** O número de linhas por parágrafo deve bater com a referência. Se destoar, o suspeito é `CORPO.entrelinha` ou a largura de `CONTEUDO`.
4. **Shape.** O recorte do fundo deve ficar visivelmente mais claro que o fundo principal, com cantos arredondados. Se o raio destoar, ajuste `RAIO_SHAPE`.

Ajuste os números em `layout.ts` e recarregue até coincidir. Só `layout.ts` deve mudar nesta etapa; se for preciso mexer em outro arquivo, algo anterior está errado.

- [ ] **Step 5: Conferir os outros anos e o caso indisponível**

Troque `anos: 7` por `1` e por `4` em `src/preview.tsx` e recarregue: o nome em negrito muda de parágrafo entre eles, e nenhum texto pode transbordar o shape.

Depois, na app (`http://localhost:5173/`), confirme que um card de 8+ anos mostra o botão desabilitado com o motivo no tooltip, e que um de 1 a 7 anos baixa o PNG com o nome de arquivo certo.

Se não houver ninguém com 8+ anos no mês visível, verifique a regra chamando `aniversarioCasa.aplicavel({ nome: 'x', anos: 8 })` no console do browser — deve devolver a string do motivo.

- [ ] **Step 6: Rodar tudo**

Run: `npm test && npm run typecheck && npm run build`
Expected: testes passam, typecheck limpo, build conclui. Confirme que `dist/` **não** contém `preview.html`:

Run: `ls dist`
Expected: `assets`, `favicon.svg`, `background.png`, `logo.png`, `index.html` — sem `preview.html` e sem a referência do Canva.

- [ ] **Step 7: Commit**

```bash
git add preview.html src/preview.tsx src/index.css src/lib/imagens/modelos/aniversarioCasa/layout.ts
git commit -m "feat: Add a visual check page and calibrate the typography

The Canva font sizes are in units that are not this art's pixels, so the scale
factor could only be estimated from the export. This page renders the model next
to the reference at 1:1 so the factor and the vertical anchors can be set by
looking at them.

The page stays in the repo: vite build has index.html as its only entry, so it
never ships, and the next art will need the same check.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Documentar no README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Acrescentar a seção**

Depois da seção que descreve a estrutura do projeto, acrescente:

```markdown
## Geração de imagens

Cada card tem um botão "Baixar imagem" que gera o PNG 1200x627 de aniversário de
casa da pessoa, desenhado em Canvas 2D no próprio browser. Não há servidor
envolvido.

O motor fica em `src/lib/imagens/` e não conhece nenhuma arte: ele carrega os
recursos que o modelo declara, cria o canvas no tamanho dele e chama `desenhar`.

Para acrescentar uma arte nova:

1. Crie `src/lib/imagens/modelos/<nome>/` com um `index.ts` exportando um
   `Modelo<P>` (contrato em `src/lib/imagens/tipos.ts`).
2. Registre em `src/lib/imagens/registro.ts`.
3. Confira o resultado em `http://localhost:5173/preview.html`, que renderiza a
   arte ao lado da referência exportada. Essa página só existe em dev.

`aplicavel(params)` devolve `true` ou o motivo de a arte não valer para aqueles
dados — é o que desabilita o botão, com o motivo no tooltip. No aniversário de
casa, só existe texto de 1 a 7 anos.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: Document image generation and how to add an art

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Verificação final

- [ ] `npm test` — todos os testes passam
- [ ] `npm run typecheck` — sem erro
- [ ] `npm run build` — conclui, e `dist/` não contém `preview.html`
- [ ] A imagem gerada coincide com `docs/referencias/aniversario-casa.png` na tipografia, nas quebras e no posicionamento
- [ ] Card de 1 a 7 anos baixa `aniversario-<nome>-<n>-anos.png`
- [ ] Card de 8+ anos mostra o botão desabilitado com o motivo no tooltip
