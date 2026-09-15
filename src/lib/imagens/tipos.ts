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
  /**
   * Só as imagens que carregaram. Uma foto que falhou fica de fora, e a arte
   * decide o que fazer — no caso das pessoas, cai no placeholder de iniciais.
   * Recurso que a arte considera obrigatório é ela quem cobra.
   */
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
  /**
   * URLs a pré-carregar. É função dos params porque uma arte pode depender de
   * imagens que só o parâmetro conhece — as fotos das pessoas do mês.
   */
  imagens(params: P): string[]
  /** Specs de fonte no formato do `ctx.font`, para o `document.fonts.load`. */
  fontes: string[]
  /** `true`, ou o motivo (exibível) de a arte não valer para esses params. */
  aplicavel(params: P): true | string
  nomeArquivo(params: P): string
  desenhar(ctx: CanvasRenderingContext2D, params: P, recursos: Recursos): void
}
