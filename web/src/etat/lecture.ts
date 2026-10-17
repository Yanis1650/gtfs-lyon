import { ref } from 'vue'

/** La lecture horaire est partagée entre la barre de carte et les fiches d'arrêt. */
export const minuterie = ref<number | null>(null)

export function arreterDefilement() {
  if (minuterie.value != null) window.clearInterval(minuterie.value)
  minuterie.value = null
}
