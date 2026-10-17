import { ref, watch } from 'vue'

import type { Vue } from '../donnees'

export const VUES: { id: Vue; titre: string }[] = [
  { id: 'offre', titre: 'L’offre' },
  { id: 'vitesse', titre: 'La vitesse' },
  { id: 'acces', titre: 'L’accessibilité' },
]

const lire = (): Vue => {
  const ancre = window.location.hash.slice(1)
  return VUES.some((v) => v.id === ancre) ? (ancre as Vue) : 'offre'
}

/** Vue active, partageable par l'ancre de l'adresse (#offre, #vitesse, #acces). */
export function useVue() {
  const vue = ref<Vue>(lire())
  window.addEventListener('hashchange', () => (vue.value = lire()))
  watch(vue, (v) => history.replaceState(null, '', `#${v}`))
  return vue
}
