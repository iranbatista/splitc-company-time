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
