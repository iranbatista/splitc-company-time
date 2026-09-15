import { aniversarioCasa } from '@/lib/imagens/modelos/aniversarioCasa'

/**
 * Todas as artes disponíveis. Existe para o dia em que houver uma UI de
 * escolha; hoje cada ponto de uso importa o modelo concreto, que preserva a
 * tipagem dos params.
 */
export const MODELOS = {
  [aniversarioCasa.id]: aniversarioCasa,
}
