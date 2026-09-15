# Geração de imagens — aniversário de casa

Data: 2026-09-15
Status: aprovado, pronto para plano de implementação

## Problema

Os dados de aniversário de casa já estão na tela, mas a peça que vai para a
pessoa é feita à mão no Canva, uma por uma. Queremos gerar a imagem a partir dos
dados que o app já tem: tempo de casa e primeiro nome.

Esta é a primeira de várias artes. O desenho abaixo separa o motor de geração
do conteúdo de cada arte, para que a segunda custe uma pasta e uma linha de
registro.

## Escopo

Dentro:

- Botão "Baixar imagem" em cada `PersonCard`, que gera e baixa um PNG 1200x627.
- Motor de geração genérico em Canvas 2D, com um modelo plugável por arte.
- Copy de 1 a 7 anos de casa.
- Testes dos módulos puros com Vitest.

Fora (YAGNI até existir um segundo modelo):

- Menu de escolha de arte, preview na tela, geração em lote, envio por e-mail.

## Decisões

**Canvas 2D nativo, não `html-to-image` nem `satori`.** A arte é estática e
posicionada em coordenadas absolutas, então o ganho de escrever layout em CSS é
pequeno. `html-to-image` serializa o nó em `foreignObject`, o que exige embutir
as fontes em base64 no SVG — sem isso o texto sai em fonte de fallback — e o
resultado varia entre Chrome e Safari. `satori` + `resvg-wasm` renderiza igual em
todo lugar, mas custa ~1.5MB de wasm no bundle para uma imagem só. Canvas não
adiciona dependência além da fonte e dá controle exato de pixel.

**Motor genérico + modelo plugável.** Mais artes virão. O motor não conhece
aniversário; o modelo não conhece React nem download.

**8+ anos desabilita o botão.** Não existe copy para esses tempos de casa e
reaproveitar o texto de 7 anos entregaria uma mensagem errada. O motivo aparece
no `title` do botão desabilitado.

**`{first_name}` em negrito** dentro do corpo, resto regular.

## Arquitetura

```
src/lib/imagens/
  tipos.ts        contrato Modelo<P> e Recursos
  canvas.ts       primitivas de desenho
  medidas.ts      quebra de linha pura
  recursos.ts     cache de imagens e fontes
  download.ts     baixarBlob()
  gerar.ts        gerarImagem(modelo, params) -> Blob
  modelos/
    aniversarioCasa/
      index.ts    o Modelo
      layout.ts   geometria da arte
      textos.ts   copy de 1 a 7 anos
  registro.ts     modelos indexados por id (tipagem concreta no ponto de uso)
src/hooks/useGerarImagem.ts
```

### Contrato

```ts
interface Recursos {
  imagens: Map<string, HTMLImageElement>
}

interface Modelo<P> {
  id: string
  nome: string
  tamanho: { largura: number; altura: number }
  imagens: string[]
  fontes: string[]
  aplicavel(params: P): true | string
  nomeArquivo(params: P): string
  desenhar(ctx: CanvasRenderingContext2D, params: P, recursos: Recursos): void
}
```

`aplicavel` devolve `true` ou o motivo da indisponibilidade, em texto exibível.
É o que generaliza a regra dos 8+ anos: cada arte futura define a própria
condição sem tocar no componente.

`gerarImagem(modelo, params)` cria o canvas no `tamanho` do modelo, aguarda
`imagens` e `fontes`, chama `desenhar` e devolve `canvas.toBlob()`. Não conhece
nenhum modelo em particular.

### Fluxo

`PersonCard` -> `useGerarImagem(aniversarioCasa, { nome, anos })` ->
`gerarImagem` -> `baixarBlob`. O hook expõe `estado: 'ocioso' | 'gerando' |
'erro'`, `indisponivel: string | null` e `gerar()`.

### Primitivas em `canvas.ts`

Qualquer arte da marca repete estas quatro:

- `coverEm(ctx, img, caixa)` — imagem cobrindo a caixa com crop central.
- `caixaArredondada(ctx, caixa, raio)` — caminho para clip ou preenchimento.
- `gradiente135(ctx, caixa)` — `CanvasGradient` no eixo do canto superior
  esquerdo ao inferior direito da caixa, com os stops da marca.
- `blocoDeTexto(ctx, linhas, origem, opcoes)` — desenha linhas já quebradas.

### Carregamento

`recursos.ts` guarda uma `Promise` por URL de imagem e por spec de fonte em
cache de módulo. `background.png` tem 1.5MB e só é buscado no primeiro clique,
nunca no carregamento da lista.

## Geometria da arte

Canvas 1200x627. Referência visual: `Aniversário de casa.png` na raiz.

| Elemento | Posição | Tamanho |
|---|---|---|
| Background | 0,0 | 1200x627, 1:1 (o arquivo já tem essa medida) |
| Logo | 63,63 | 177x66 |
| Shape | 475,89 | 662x475, raio ~32 |
| Área de texto do shape | 515,129 | largura 582 |
| Título 1 | esquerda 63, base 564 | largura máx 412 |

O `y` do shape vem de `627 - 63 - 475 = 89`. A spec original dizia "63 do topo",
o que é incompatível com altura 475 em 627px de altura total; a referência
confirma 89. Manda base + altura.

O fundo do shape é o mesmo `background.png` em *cover*: escala
`max(662/1200, 475/627) = 0.7576`, resultando em 909x475 com crop central
horizontal. Esse zoom é o que cria o contraste com o fundo principal.

Título 1 quebra em "Aniversário de" / "empresa" — a largura máxima de 412 vai
até a borda esquerda do shape menos a margem.

Gradiente dos dois títulos: 135° (canto superior esquerdo ao inferior direito da
caixa do texto), stops `#f7a205`, `#f07f16` em 50%, `#ea5518`. Corpo em
`#ffffff`.

### Escala das fontes — a verificar

Os tamanhos 39,5 / 25 / 18 são unidades do Canva, não pixels. Medindo a altura
de caixa alta na referência exportada, os equivalentes em pixel ficam por volta
de 54 / 34 / 25, um fator de ~1.371.

A implementação define uma constante única `ESCALA_CANVA` e **a valida
renderizando e comparando com `Aniversário de casa.png`**, ajustando o fator se
destoar. O número não está confirmado; está estimado por medição da referência.

Entrelinha: corpo 1.5; parágrafos separados por uma linha em branco; 20px entre
Título 2 e o corpo.

## Fontes

- `DM Serif Display` italic 400 — Título 1. Nova dependência:
  `@fontsource/dm-serif-display`.
- `Outfit` bold 700 — Título 2 e o trecho do primeiro nome.
- `Outfit` regular 400 — corpo. Já presente via `@fontsource-variable/outfit`.

Servidas do bundle, nunca de CDN externa. `document.fonts.load()` para cada spec
antes de desenhar: sem essa espera o canvas desenha em fallback sem avisar.

## Copy

`TITULO_1`: `Aniversário de empresa`

`titulo2(anos)`: `Parabéns pelo seu {anos}º ano na SplitC!`

Os corpos de 1 a 7 anos são os textos fornecidos pelo autor da arte, guardados
como parágrafos de trechos (`{ texto, negrito }`) e não como string com
marcador. O trecho do primeiro nome carrega `negrito: true`, e é assim que o
destaque sobrevive até a medição no canvas sem parsing no meio do render.

`primeiroNome(nome)` devolve a primeira palavra do nome completo.

## Comportamento

- Botão "Baixar imagem" com ícone de download em cada card.
- `anos < 1 || anos > 7` -> botão desabilitado, `title` com o motivo vindo de
  `aplicavel`.
- Clique -> `gerando` (botão desabilitado, spinner) -> download -> `ocioso`.
- Nome do arquivo: `aniversario-{nome-em-slug}-{anos}-anos.png`.

## Erros

Falha ao carregar imagem ou fonte, ou `toBlob` devolvendo `null`: estado `erro`,
botão vira "Tentar de novo", mensagem no `title`, causa em `console.error`. O
card continua utilizável; nada quebra a lista.

## Testes

Vitest entra no projeto (não há runner hoje). Cobertura dos módulos puros:

- `textos`: seleção de corpo por ano, `primeiroNome` (nome simples, composto,
  espaços extras), `temCopy` nas bordas 0/1/7/8.
- `medidas`: quebra em largura dada, trecho em negrito atravessando a quebra,
  palavra mais larga que a caixa.
- `layout`: a conta de cover/crop e as coordenadas derivadas.

Render e download ficam fora dos testes automatizados: são validados por
inspeção visual contra a referência.

## Verificação

1. `npm run typecheck` e `npx vitest run` passam.
2. Uma imagem gerada é comparada lado a lado com `Aniversário de casa.png`;
   `ESCALA_CANVA` é ajustada até a tipografia coincidir.
3. Um card com 8+ anos mostra o botão desabilitado com o motivo.

## Anexo — copy integral

Título 1: `Aniversário de empresa`
Título 2: `Parabéns pelo seu {anos}º ano na SplitC!`

Nos corpos abaixo, `{nome}` é o trecho em negrito com o primeiro nome. A linha
em branco separa parágrafos.

### 1 ano

```
{nome}, há um ano você topou fazer parte dessa jornada. Entre aprendizados, novidades e muitos desafios, você começou a construir a sua história por aqui e deu os primeiros passos vivendo a nossa cultura.

Obrigada por fazer parte do nosso time e por se mover rápido desde o primeiro dia. Esse é só o começo da sua jornada!

Com carinho,
SplitC
```

### 2 anos

```
Em dois anos, muita coisa muda. Hoje você já conhece nossos desafios, ajuda a encontrar caminhos e faz parte das decisões que movem a SplitC todos os dias.

{nome}, obrigada por fazer parte do nosso time e por demonstrar ownership em tudo o que faz. Que venham muitos anos construindo essa história com a gente!

Com carinho,
SplitC
```

### 3 anos

```
Três anos representam uma trajetória de evolução constante. Você acompanhou mudanças, compartilhou conhecimento e ajudou a elevar o nível do nosso time com a busca por excelência.

{nome}, obrigada por fazer parte do nosso time e por crescer junto com a SplitC. Seu trabalho faz diferença todos os dias.

Com carinho,
SplitC
```

### 4 anos

```
{nome}, ao longo desses quatro anos, você ajudou a construir relações, fortalecer nosso jeito de trabalhar e gerar impacto para quem mais importa: nossos clientes.

Obrigada por fazer parte do nosso time e por colocar o cliente no centro de cada entrega. É muito bom ter você construindo essa história com a gente.

Com carinho,
SplitC
```

### 5 anos

```
Cinco anos é muita história pra contar. Você acompanhou mudanças, viu a SplitC crescer e, mais importante, ajudou a construir boa parte do que somos hoje.

{nome}, obrigada por fazer parte do nosso time e por viver nossos valores todos os dias, sempre com ownership, excelência e vontade de fazer acontecer. Bora pros próximos capítulos!

Com carinho,
SplitC
```

### 6 anos

```
{nome}, seis anos não acontecem por acaso. É tempo de construir confiança, criar boas histórias e deixar sua marca por onde passa.

Obrigada por fazer parte do nosso time e por seguir se movendo rápido, buscando excelência e contribuindo para que nossos clientes tenham a melhor experiência. É muito bom ter você com a gente!

Com carinho,
SplitC
```

### 7 anos

```
Sete anos... isso é muita coisa! Você acompanhou diferentes fases da SplitC, viu muita coisa mudar e fez parte de cada uma delas.

{nome}, obrigada por fazer parte do nosso time e por seguir construindo essa história com ownership, parceria e foco em fazer o melhor para nossos clientes. Que venham muitos anos pela frente!

Com carinho,
SplitC
```
