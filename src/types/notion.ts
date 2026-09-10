/**
 * Tipos apenas das partes da API do Notion que este app realmente usa.
 * Nada de `any`: o que não é usado fica de fora do tipo.
 */

export interface NotionRichText {
  plain_text: string
}

export interface NotionTitleProperty {
  type: 'title'
  title: NotionRichText[]
}

export interface NotionDateValue {
  start: string
  end: string | null
}

export interface NotionDateProperty {
  type: 'date'
  date: NotionDateValue | null
}

export interface NotionEmailProperty {
  type: 'email'
  email: string | null
}

export interface NotionSelectOption {
  id: string
  name: string
}

export interface NotionSelectProperty {
  type: 'select'
  select: NotionSelectOption | null
}

export interface NotionMultiSelectProperty {
  type: 'multi_select'
  multi_select: NotionSelectOption[]
}

/** As quatro propriedades consumidas da base de pessoas. */
export interface PessoaProperties {
  Nome: NotionTitleProperty
  'Quando entrou na empresa?': NotionDateProperty
  'E-mail': NotionEmailProperty
  Setor: NotionMultiSelectProperty
}

export interface NotionPage {
  object: 'page'
  id: string
  properties: Partial<PessoaProperties>
}

export interface NotionQueryResponse {
  object: 'list'
  results: NotionPage[]
  has_more: boolean
  next_cursor: string | null
}

/* ---------- Blocos (foto) ---------- */

export interface NotionFileImage {
  type: 'file'
  /** URL assinada, expira em ~1h. */
  file: { url: string; expiry_time: string }
}

export interface NotionExternalImage {
  type: 'external'
  /** URL permanente. */
  external: { url: string }
}

export type NotionImage = NotionFileImage | NotionExternalImage

export interface NotionImageBlock {
  object: 'block'
  id: string
  type: 'image'
  has_children: boolean
  image: NotionImage
}

export interface NotionOtherBlock {
  object: 'block'
  id: string
  type: string
  has_children: boolean
}

export type NotionBlock = NotionImageBlock | NotionOtherBlock

export interface NotionBlockChildrenResponse {
  object: 'list'
  results: NotionBlock[]
  has_more: boolean
  next_cursor: string | null
}

export function isImageBlock(block: NotionBlock): block is NotionImageBlock {
  return block.type === 'image' && 'image' in block
}

export function imageUrl(image: NotionImage): string {
  return image.type === 'file' ? image.file.url : image.external.url
}
