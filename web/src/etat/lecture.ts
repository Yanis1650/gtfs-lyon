import { ref } from 'vue'
import { debutTranche, simulation, VITESSE_DEFAUT } from './simulation'

/** La lecture horaire est partagée entre la barre de carte et les fiches d'arrêt. */
export const minuterie = ref<number | null>(null)

export function arreterDefilement() {
  if (minuterie.value != null) window.clearInterval(minuterie.value)
  minuterie.value = null
}

/** Commande commune au bouton visible sur la carte et aux réglages de la barre horaire. */
export function basculerVehicules(heure: number) {
  arreterDefilement()
  simulation.actif = !simulation.actif
  if (simulation.actif) simulation.vitesse = VITESSE_DEFAUT
  simulation.temps = debutTranche(heure)
  simulation.lecture = simulation.actif && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
