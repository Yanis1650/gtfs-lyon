import { onBeforeUnmount, ref, watch } from 'vue'

import type { Vue } from '../donnees'
import { ANCRE_DEMONSTRATION, demanderDemonstration } from './demonstration'

export const VUES: { id: Vue; titre: string }[] = [
  { id: 'offre', titre: 'L’offre' },
  { id: 'vitesse', titre: 'La vitesse' },
  { id: 'acces', titre: 'L’accessibilité' },
]

const lire = (): Vue => {
  const ancre = window.location.hash.slice(1)
  if (ancre === ANCRE_DEMONSTRATION) { demanderDemonstration(); return 'offre' }
  return VUES.some((v) => v.id === ancre) ? (ancre as Vue) : 'offre'
}

export function ouvrirDemonstration() {
  if (window.location.hash === `#${ANCRE_DEMONSTRATION}`) demanderDemonstration()
  else window.location.hash = ANCRE_DEMONSTRATION
}

/** Vues et scène de découverte : seules ces ancres sont reconnues. */
export function useVue() {
  const vue = ref<Vue>(lire())
  const actualiser = () => (vue.value = lire())
  window.addEventListener('hashchange', actualiser)
  onBeforeUnmount(() => window.removeEventListener('hashchange', actualiser))
  watch(vue, (v) => {
    if (v === 'offre' && window.location.hash === `#${ANCRE_DEMONSTRATION}`) return
    window.history.replaceState(null, '', `#${v}`)
  })
  return vue
}
