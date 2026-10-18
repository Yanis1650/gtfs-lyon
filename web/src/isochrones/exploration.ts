import type { Map, MapMouseEvent } from 'maplibre-gl'
import { watch } from 'vue'
import { chargerCarreaux, type Carreaux, type Vue } from '../donnees'
import { isochrones } from '../etat/isochrones'
import { creerLecteur } from './chargement'
import { afficherIsochrones } from './couches'
import { cadencer } from './cadence'
import { dessiner, ordonner, type Cellule, type TracesIsochrones } from './geometrie'

/** Un chargement à la fois, puis la dernière cible ; un clic préempte le survol. */
export function brancherIsochrones(carte: Map, ctx: { vue: () => Vue }) {
  const lire = creerLecteur(import.meta.env.BASE_URL + 'data/')
  let cellules: Cellule[] | undefined
  let version = ''
  let arreter: AbortController | undefined
  let enCours = false
  let cible: string | null = null
  let revision = 0
  let derniere: { temps: Uint8Array; origine: number } | undefined
  let traces: TracesIsochrones | undefined
  const actif = () => isochrones.actif && ctx.vue() === 'acces'

  function afficher() { afficherIsochrones(carte, actif(), traces) }
  function annuler() {
    suivi.annuler()
    arreter?.abort()
    enCours = false
    revision++
    isochrones.chargement = false
  }
  function retracer() {
    if (cellules && derniere) {
      traces = dessiner(cellules, derniere.temps, derniere.origine, isochrones.seuil)
      isochrones.habitants = traces.habitants
      isochrones.carreaux = traces.carreaux
    }
    afficher()
  }
  async function charger(id: string, tour: number) {
    arreter = new AbortController()
    enCours = true
    isochrones.chargement = true
    isochrones.erreur = ''
    try {
      const [{ index, temps, numero }, carreaux] = await Promise.all([
        lire(id, arreter.signal), chargerCarreaux(),
      ])
      if (tour !== revision || !actif()) return
      if (index.version !== version) {
        cellules = ordonner(carreaux as Carreaux, index.ids)
        version = index.version
      }
      derniere = { temps, origine: numero }
      isochrones.origine = id
      isochrones.heure = index.heure
      isochrones.fenetre = index.fenetre
      retracer()
    } catch {
      if (tour !== revision || !actif() || cible !== id) return
      traces = undefined
      derniere = undefined
      isochrones.origine = null
      isochrones.erreur = 'Isochrone indisponible. Réessayez sur un carreau.'
      afficher()
      cible = null
    } finally {
      if (tour === revision) {
        enCours = false
        if (actif() && cible && cible !== id) void charger(cible, tour)
        else isochrones.chargement = false
      }
    }
  }
  function demander(id: string, clic: boolean) {
    if (clic) {
      isochrones.fixe = true
      suivi.annuler()
      if (isochrones.origine === id && traces && !enCours) return
      annuler()
    } else if (id === cible) return
    cible = id
    if (!enCours) void charger(id, revision)
  }
  function choisir(e: MapMouseEvent, clic: boolean) {
    if (!actif() || (!clic && (isochrones.fixe || e.originalEvent.buttons || carte.isMoving()))) return
    if (!carte.getLayer('carreaux')) return
    const id = carte.queryRenderedFeatures(e.point, { layers: ['carreaux'] })[0]?.properties.id as string | undefined
    if (id) demander(id, clic)
  }
  const suivi = cadencer((e: MapMouseEvent) => choisir(e, false))
  const survoler = (e: MapMouseEvent) => {
    if (actif() && !isochrones.fixe) suivi.recevoir(e)
  }
  const cliquer = (e: MapMouseEvent) => choisir(e, true)
  const sortir = () => { if (!isochrones.fixe) { annuler(); cible = null } }
  const effacer = watch(() => isochrones.effacement, () => {
    annuler(); cible = null; derniere = traces = undefined; afficher()
  })
  const seuil = watch(() => isochrones.seuil, retracer)
  const centre = watch(() => isochrones.centreDemande, () => {
    if (!actif() || !carte.getLayer('carreaux')) return
    const id = carte.queryRenderedFeatures(carte.project(carte.getCenter()), { layers: ['carreaux'] })[0]?.properties.id
    if (typeof id === 'string') demander(id, true)
    else isochrones.erreur = 'Placez le centre de la carte sur un carreau habité.'
  })
  const vue = watch(actif, (visible) => {
    annuler(); cible = null
    if (!visible) isochrones.fixe = false
    if (visible && isochrones.origine && !traces) demander(isochrones.origine, isochrones.fixe)
    afficher()
  }, { immediate: true })
  carte.on('mousemove', survoler)
  carte.on('click', cliquer)
  carte.on('mouseout', sortir)
  carte.on('remove', () => {
    annuler(); effacer(); seuil(); vue(); centre()
    carte.off('mousemove', survoler); carte.off('click', cliquer); carte.off('mouseout', sortir)
  })
  return afficher
}
