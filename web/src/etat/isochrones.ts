import { reactive } from 'vue'

/** Exploration distincte des indicateurs agrégés : un départ, plusieurs destinations. */
export const isochrones = reactive({
  actif: false,
  seuil: 45 as 15 | 30 | 45,
  fixe: false,
  origine: null as string | null,
  chargement: false,
  erreur: '',
  habitants: 0,
  carreaux: 0,
  heure: 8,
  fenetre: 60,
  effacement: 0,
  centreDemande: 0,
})

export function effacerIsochrone() {
  isochrones.fixe = false
  isochrones.origine = null
  isochrones.erreur = ''
  isochrones.habitants = isochrones.carreaux = 0
  isochrones.effacement++
}
