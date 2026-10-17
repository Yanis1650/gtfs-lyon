import type { ProprietesCarreau } from '../donnees'

const population = (carreaux: ProprietesCarreau[]) => carreaux.reduce((s, c) => s + c.pop, 0)

/** Valeur atteinte ou dépassée par la moitié des habitants : médiane pondérée par la population. */
export function medianePonderee(carreaux: ProprietesCarreau[], valeur: (c: ProprietesCarreau) => number): number {
  const total = population(carreaux)
  let cumul = 0
  for (const c of [...carreaux].sort((a, b) => valeur(a) - valeur(b))) {
    cumul += c.pop
    if (cumul >= total / 2) return valeur(c)
  }
  return 0
}

/** Part des habitants dont le temps depuis le pôle ne dépasse pas `seuil` minutes. */
export function partSous(carreaux: ProprietesCarreau[], pole: string, seuil: number): number {
  const total = population(carreaux)
  const dedans = population(carreaux.filter((c) => (c[`t_${pole}`] ?? Infinity) <= seuil))
  return total ? dedans / total : 0
}

export { population }
