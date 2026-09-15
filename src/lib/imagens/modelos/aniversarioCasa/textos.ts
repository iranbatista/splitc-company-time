import type { Bloco } from '@/lib/imagens/tipos'

/** A quebra é fixa no texto, para não depender da largura da coluna. */
export const TITULO_1 = 'Aniversário\nde casa'

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

Obrigado por fazer parte do nosso time e por se mover rápido desde o primeiro dia. Esse é só o começo da sua jornada!

Com carinho,
SplitC`,

  2: `Em dois anos, muita coisa muda. Hoje você já conhece nossos desafios, ajuda a encontrar caminhos e faz parte das decisões que movem a SplitC todos os dias.

{nome}, obrigado por fazer parte do nosso time e por demonstrar ownership em tudo o que faz. Que venham muitos anos construindo essa história com a gente!

Com carinho,
SplitC`,

  3: `Três anos representam uma trajetória de evolução constante. Você acompanhou mudanças, compartilhou conhecimento e ajudou a elevar o nível do nosso time com a busca por excelência.

{nome}, obrigado por fazer parte do nosso time e por crescer junto com a SplitC. Seu trabalho faz diferença todos os dias.

Com carinho,
SplitC`,

  4: `{nome}, ao longo desses quatro anos, você ajudou a construir relações, fortalecer nosso jeito de trabalhar e gerar impacto para quem mais importa: nossos clientes.

Obrigado por fazer parte do nosso time e por colocar o cliente no centro de cada entrega. É muito bom ter você construindo essa história com a gente.

Com carinho,
SplitC`,

  5: `Cinco anos é muita história pra contar. Você acompanhou mudanças, viu a SplitC crescer e, mais importante, ajudou a construir boa parte do que somos hoje.

{nome}, obrigado por fazer parte do nosso time e por viver nossos valores todos os dias, sempre com ownership, excelência e vontade de fazer acontecer. Bora pros próximos capítulos!

Com carinho,
SplitC`,

  6: `{nome}, seis anos não acontecem por acaso. É tempo de construir confiança, criar boas histórias e deixar sua marca por onde passa.

Obrigado por fazer parte do nosso time e por seguir se movendo rápido, buscando excelência e contribuindo para que nossos clientes tenham a melhor experiência. É muito bom ter você com a gente!

Com carinho,
SplitC`,

  7: `Sete anos... isso é muita coisa! Você acompanhou diferentes fases da SplitC, viu muita coisa mudar e fez parte de cada uma delas.

{nome}, obrigado por fazer parte do nosso time e por seguir construindo essa história com ownership, parceria e foco em fazer o melhor para nossos clientes. Que venham muitos anos pela frente!

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
