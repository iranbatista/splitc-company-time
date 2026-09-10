# Aniversários de empresa

App React + Vite + TypeScript + Tailwind que lista quem completa aniversário
de empresa no mês corrente, com os dados vindos de um data source do Notion.

## O browser nunca fala direto com o Notion

A API do Notion **não** responde a chamadas diretas do browser: não manda
headers de CORS e exige um token que não pode ir para o bundle.

Por isso sempre existe um proxy no meio, que injeta o `Authorization` do lado do
servidor. Quem faz esse papel muda conforme o ambiente:

```
dev:
  browser ──► /notion/v1/...  ──► [dev server do Vite]     ──► api.notion.com/v1/...
               (mesma origem)      injeta Authorization

produção (GitHub Pages):
  browser ──► worker.workers.dev/v1/... ──► [Cloudflare Worker] ──► api.notion.com/v1/...
               (CORS liberado p/ a           injeta Authorization
                origem do Pages)
```

Nos dois casos o `NOTION_TOKEN` vive só no servidor: no dev é lido pelo
`loadEnv`/`process.env` no processo Node do Vite; em produção é um secret do
Cloudflare. Ele não é exposto via `import.meta.env` e **não entra no bundle**.

O front não sabe a diferença: `src/lib/notion.ts` usa `baseURL: __API_BASE__`,
que o `vite.config.ts` resolve para `/notion/v1` (padrão) ou para a URL do
Worker quando a env `API_BASE` está setada no build.

Ver [Deploy](#deploy) para o passo a passo.

## Setup

```bash
npm install
cp .env.example .env
# preencha NOTION_TOKEN e NOTION_DATA_SOURCE_ID
npm run dev
```

### Variáveis de ambiente

| Variável | Segredo? | Para quê |
| --- | --- | --- |
| `NOTION_TOKEN` | **sim** | Token da integração interna. Só o processo Node do Vite lê. Sem prefixo `VITE_` — de propósito. |
| `NOTION_DATA_SOURCE_ID` | não | Id do data source consultado. Injetado no bundle via `define`. |

Alterou o `.env`? **Reinicie o dev server** — o `loadEnv` roda só no boot.

### Permissão no Notion

O token precisa ter acesso ao database. No Notion: abra a página do database →
`···` → **Connections** → adicione a integração. Sem isso a API responde **404**
(e não 403), e o app mostra exatamente essa dica na tela de erro.

## Como funciona

### Fonte de dados

```
POST /notion/v1/data_sources/<NOTION_DATA_SOURCE_ID>/query
Notion-Version: 2026-03-11
```

Filtro (`and`):

- `Status` (select) `equals` `"Ativo"`
- `Quando entrou na empresa?` (date) `is_not_empty`

Pagina até o fim com `has_more` / `next_cursor` (`page_size: 100`).

**Uma query serve todos os meses.** O filtro do Notion não sabe filtrar por mês
(a propriedade é uma data completa, e o que interessa é só o mês dela), então a
query é a mesma para qualquer mês de referência e o recorte acontece no cliente.
Trocar de mês no seletor **não faz request nenhuma**.

Propriedades consumidas: `Nome` (title), `Quando entrou na empresa?` (date),
`E-mail` (email), `Setor` (multi_select). Os tipos estão declarados em
`src/types/notion.ts` — sem `any`.

### A regra

Entra na lista quem tem **o mês da admissão igual ao mês de referência** E
**pelo menos 1 ano completo** de empresa. Quem entrou nesse mesmo mês do ano da
referência fica de fora (0 anos de casa).

A referência é um `{ ano, mes }` — o mês corrente por padrão, ou qualquer um dos
próximos escolhido no seletor. Para um mês futuro o cálculo é o mesmo:
`anosDeCasa = referencia.ano - admissao.ano`. Quem entrou em dez/2020 aparece em
dez/2026 com 6 anos; quem entrou em jan/2026 aparece em jan/2027 com 1 ano.

`src/lib/aniversario.ts` é puro: sem rede, sem estado, e a referência sempre
chega por parâmetro. A aritmética de meses (`avancarMes`, `proximosMeses`) roda
em base 0 (`ano * 12 + mes - 1`), então a virada de ano sai de graça e nos dois
sentidos.

**Parse de data:** a propriedade vem como `"YYYY-MM-DD"`, sem timezone.
`new Date("2021-03-01")` é interpretado como **UTC** meia-noite, então em fuso
negativo (BRT = UTC-3) `getDate()` devolve `28` — o dia anterior, e às vezes o
mês anterior. Por isso o parse é feito com `split('-')` e `Number()`, montando
os campos à mão. Nenhum `Date` participa da comparação.

### Seletor de mês

O mês corrente mais os **6 próximos** (`MESES_VISIVEIS = 7`), em pills. Cada
pill mostra a contagem daquele mês, calculada no cliente a partir da mesma lista
— então dá pra ver onde tem gente antes de clicar. Meses de outro ano levam o
ano no rótulo curto (`jan 27`) e no título (`janeiro de 2027`).

Mudar `MESES_VISIVEIS` (ou passar `quantidade` para `proximosMeses`) é tudo o
que existe pra mostrar mais meses; nada mais no app depende do número 7.

### Fotos

A foto de cada pessoa está no corpo da página, como bloco `image`:

```
GET /notion/v1/blocks/{page_id}/children
```

Pega o primeiro bloco com `type === "image"`. Se o bloco vier com
`has_children: true` (coluna, callout, toggle), desce recursivamente — até 3
níveis. `image.type === "external"` é URL permanente; `"file"` é URL **assinada
que expira em ~1h**.

Isso é **1 request por pessoa** e o rate limit do Notion é ~3 req/s, então:

- **limiter** com no máximo 3 requests em voo e um start a cada 340ms
  (`src/lib/notion.ts`);
- **retry com backoff exponencial** em 429/502/503/504, respeitando o header
  `Retry-After` quando presente;
- a **lista carrega primeiro** e as fotos vêm depois, em background — cada card
  se atualiza quando a sua foto chega. A tela nunca fica bloqueada esperando
  todas;
- as fotos são buscadas **só para o mês visível**, não para a empresa inteira, e
  ficam em cache por página. Trocar de mês e voltar não refaz request, e as
  fotos que estavam em voo quando o mês mudou continuam válidas — vão para o
  cache em vez de serem descartadas.

Falha ao buscar uma foto não vira erro de tela: aquele card só cai no
placeholder.

## UI

Visual compartilhado com o [splitc-profile-picture](../splitc-profile-picture):
os dois apps são ferramentas internas da SplitC e usam a **mesma base de
estilo**, copiada bloco a bloco em `src/index.css`.

| Peça | Valor |
| --- | --- |
| Fonte | Outfit Variable (`@fontsource-variable/outfit`) |
| Marca | `--brand-from #f98510` → `--brand-mid #fda03d` → `--brand-to #ff6766` |
| Texto | `--ink #242424` / `--ink-muted #6f6a66` |
| Fundo | `--page #fbfbfb` + wash radial quente e fixo no `body` |
| Raio | `--radius: 1rem`, superfícies em `1.75rem` |
| Utilities | `.surface`, `.brand-gradient`, `.brand-text`, `.eyebrow` |
| Favicon | o mesmo `favicon.svg` da marca |

O gradiente é o único movimento alto da marca, então fica reservado ao título
(`.brand-text`) e ao botão primário. Nos cards ele aparece só como um aro de 2px
em volta da foto — a mesma ideia de moldura por tempo de casa do outro app — e
o selo de "X anos de casa" usa a tinta suave `--tint`, que com 20 cards na tela
não grita.

Componentes:

- Seletor do mês corrente + 6 próximos em pills, com a contagem de cada mês;
  rola no eixo x em telas estreitas em vez de quebrar linha
- Grid responsivo (1 → 2 → 3 → 4 colunas): foto circular com aro de marca, nome,
  setor em `.eyebrow`, selo de tempo de casa e dia do mês
- Ordenado por dia do mês, ascendente (empate resolvido por nome, `pt-BR`)
- Placeholder com as iniciais quando não há foto — e o mesmo placeholder como
  fallback de `onError` da `<img>`, que é o caso da URL assinada expirada
- Skeleton no carregamento da lista; **sweep de marca só no espaço da foto**
  enquanto ela ainda não chegou (mesma animação do `indeterminate` do outro app,
  desligada em `prefers-reduced-motion`)
- Estado vazio: "Ninguém faz aniversário de casa em \<mês\>"
- Estado de erro visível, com **404 tratado à parte** (integração provavelmente
  não compartilhada com o database) dos outros status. Com erro na tela o header
  não mostra contagem — "0 pessoas" ali seria uma mentira útil pra ninguém
- Header com o mês corrente por extenso em português e a contagem
- Tailwind v4 puro (CSS-first, sem `tailwind.config`), sem biblioteca de
  componentes

### A divergência de propósito

O splitc-profile-picture é light-only. Aqui o dark existe porque era requisito,
mas é **derivado dos mesmos tokens**: só as superfícies invertem
(`--page`, `--card`, `--ink`, `--hairline`), a paleta de marca não muda. Em
light os dois apps são pixel-compatíveis; em dark este continua sendo
reconhecidamente o mesmo produto.

## Estrutura

```
src/
  lib/
    aniversario.ts        # regra pura de mês/anos, aritmética de meses, rótulos
    lista.ts              # puro: recorte de um mês + contagem por mês
    notion.ts             # axios, paginação, limiter, retry, fotos, erros
  hooks/
    useAniversariantes.ts # busca + estado + cache de fotos, por mês de referência
  types/
    notion.ts             # tipos explícitos das propriedades/blocos usados
    aniversariante.ts     # tipo de domínio
  components/
    Header.tsx  MonthPicker.tsx  PersonCard.tsx  Avatar.tsx
    SkeletonCard.tsx  EmptyState.tsx  ErrorState.tsx
  App.tsx  main.tsx  index.css   # index.css carrega os tokens da marca
public/favicon.svg          # ícone da SplitC, igual ao do outro app
vite.config.ts              # proxy /notion + injeção do Authorization + alias @/
worker/
  src/index.ts              # proxy do Notion em produção (Cloudflare Worker)
  wrangler.toml             # nome, origens permitidas, data source aceito
.github/workflows/
  deploy.yml                # build + publish no GitHub Pages
  deploy-worker.yml         # tsc + wrangler deploy do Worker
```

Imports usam o alias `@/` → `src/`, como no splitc-profile-picture.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Dev server com o proxy do Notion |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Type-check + build (gera `dist/`) |
| `npm run preview` | Serve o `dist/` — só carrega dados se `API_BASE` apontar para o Worker |

No `worker/`:

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Worker local em `localhost:8787` |
| `npm run deploy` | Publica o Worker na Cloudflare |
| `npm run tail` | Logs do Worker em produção |

## Deploy

Front no **GitHub Pages** (estático) + proxy num **Cloudflare Worker** (free
tier). O Worker guarda o token; o Pages guarda só o código.

### 1. Publicar o Worker

```bash
cd worker
npm install
npx wrangler login
```

Editar `worker/wrangler.toml`:

- `ORIGENS_PERMITIDAS`: `https://SEU_USUARIO.github.io,http://localhost:5173`
  (só a origem, sem o caminho do repo)
- `NOTION_DATA_SOURCE_ID`: o mesmo id do `.env`

Guardar o token como secret e publicar a primeira vez na mão:

```bash
npx wrangler secret put NOTION_TOKEN   # cola o ntn_... quando pedir
npm run deploy
```

A saída mostra a URL, algo como
`https://splitc-notion-proxy.SEU_SUBDOMINIO.workers.dev`.

O `wrangler secret put` só precisa rodar uma vez (e de novo se o token rotacionar):
o secret vive na Cloudflare e sobrevive aos deploys. Os deploys seguintes são
automáticos — ver [Deploy automático](#deploy-automático).

### 2. Configurar o repositório

Em **Settings → Pages**, `Source: GitHub Actions`.

Em **Settings → Secrets and variables → Actions → Variables**, criar duas
_repository variables_ (não são secrets — as duas já vão para o bundle):

| Variable | Valor |
| --- | --- |
| `API_BASE` | `https://splitc-notion-proxy.SEU_SUBDOMINIO.workers.dev/v1` |
| `NOTION_DATA_SOURCE_ID` | o id do data source |

### 3. Secrets da Cloudflare no GitHub

Para o CI conseguir publicar o Worker, em **Settings → Secrets and variables →
Actions → Secrets**:

| Secret | Onde achar |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | dash.cloudflare.com → My Profile → API Tokens → Create Token → template **Edit Cloudflare Workers** |
| `CLOUDFLARE_ACCOUNT_ID` | dash.cloudflare.com → Workers & Pages, na barra lateral direita |

O `NOTION_TOKEN` **não** vai para o GitHub — ele fica só na Cloudflare.

### 4. Push

A partir daqui é tudo automático.

### O que o Worker aceita

Ele é deliberadamente restrito — sem isso, um proxy aberto daria acesso ao
workspace inteiro do Notion com o token da integração:

- só `POST /v1/data_sources/<o id configurado>/query` e
  `GET /v1/blocks/<uuid>/children`
- só requests com `Origin` na allowlist
- `Authorization` e `Notion-Version` são montados no Worker; nada que o cliente
  mandar sobrescreve os dois

### Limite conhecido

`Origin` só é imposto por browser — um `curl` não manda o header e recebe 403,
mas pode forjá-lo. Ou seja: **quem descobrir a URL do Worker consegue ler a
lista de pessoas** (nome, e-mail, setor, foto). Isso é inerente a site estático
público + proxy público, e foi uma escolha consciente aqui.

Se um dia precisar fechar:

- Cloudflare Access (Zero Trust) na frente do Worker, com login do domínio; ou
- sair do Pages para um host com serverless function + sessão autenticada.

Vale ligar uma regra de **Rate limiting** no painel da Cloudflare para a rota do
Worker — o free tier permite uma.

## Deploy automático

Dois workflows, separados por caminho, para nenhum dos dois rodar à toa:

| Workflow | Dispara quando | O que faz |
| --- | --- | --- |
| `.github/workflows/deploy.yml` | push na `main` fora de `worker/**` | build com `BASE_PATH=/<repo>/` + publica no Pages |
| `.github/workflows/deploy-worker.yml` | push na `main` em `worker/**` | `tsc --noEmit` + `wrangler deploy` |

Os dois também aceitam disparo manual em **Actions → Run workflow**.

O deploy do Worker não passa nenhum secret: o `NOTION_TOKEN` já está na
Cloudflare e continua lá. O `tsc --noEmit` antes do deploy existe porque
`wrangler deploy` não checa tipos sozinho.
