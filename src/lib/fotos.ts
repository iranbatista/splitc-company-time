/**
 * O S3 do Notion não manda header de CORS, então uma foto desenhada direto da
 * origem dele contamina o canvas e o `toBlob` passa a lançar. Para aparecer numa
 * imagem gerada, a foto tem de vir pelo nosso proxy.
 *
 * A lista continua usando a URL original: exibir na tela não precisa de CORS, e
 * assim a navegação normal não passa pelo proxy.
 */
export function urlDaFotoParaCanvas(fotoUrl: string): string {
  return `${__FOTO_BASE__}?url=${encodeURIComponent(fotoUrl)}`
}
