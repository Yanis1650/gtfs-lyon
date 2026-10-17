// Véhicules en circulation d'après les horaires du jour de référence : horloge partagée par
// le panneau et la carte, et boucle d'animation qui place chaque véhicule à chaque image.
import type { Map as CarteMapLibre } from 'maplibre-gl'
import { reactive, watch } from 'vue'

import { encres } from '../carte/expressions'
import { chargerLignes, chargerTroncons, chargerVehicules, type ProprietesLigne, type Vue } from '../donnees'
import { terracotta } from '../palette'
import { creerCalque, type Vehicule } from '../simulation/calque'
import { type Course, indexerTroncons, position, preparer, type Trace } from '../simulation/trajets'

/** Une heure simulée par minute réelle. */
export const VITESSE = 60
/** Le jour de service commence à 4 h et court jusqu'à 4 h le lendemain (28 h). */
const DEBUT = 4 * 3600
const FIN = DEBUT + 24 * 3600

export const simulation = reactive({
  actif: false,
  lecture: false,
  /** Secondes depuis minuit du jour de référence. */
  temps: 8 * 3600,
  vehicules: 0,
})

/** Tranche horaire de l'instant simulé (0 = 4 h-5 h), comme le curseur des heures. */
export const trancheDe = (t: number) => Math.min(23, Math.max(0, Math.floor((t - DEBUT) / 3600)))
export const debutTranche = (tranche: number) => DEBUT + tranche * 3600
const fichier = (tranche: number) => `${String((4 + tranche) % 24).padStart(2, '0')}h`

interface Contexte {
  sombre: () => boolean
  vue: () => Vue
}

export function brancherSimulation(carte: CarteMapLibre, ctx: Contexte) {
  let calque: ReturnType<typeof creerCalque> | null = null
  let index: Map<string, Trace> | null = null
  let lignes: Map<string, ProprietesLigne> | null = null
  const heures = new Map<number, Course[] | null>()
  let image = 0
  let precedent = 0
  let sale = true

  async function charger(tranche: number) {
    if (tranche > 23 || heures.has(tranche)) return
    heures.set(tranche, null)
    try {
      const [donnees, troncons, l] = await Promise.all([chargerVehicules(fichier(tranche)), chargerTroncons(), chargerLignes()])
      index ??= indexerTroncons(troncons)
      lignes ??= new Map(l.features.map((f) => [f.properties.id, f.properties]))
      heures.set(tranche, preparer(donnees, index, lignes))
    } catch {
      // Fichier absent ou réseau coupé : une heure vide, sans nouvel essai à chaque image.
      heures.set(tranche, [])
    }
    sale = true
  }

  function boucle(maintenant: number) {
    image = requestAnimationFrame(boucle)
    // Au retour d'un onglet masqué, on reprend où l'on en était, sans bond.
    const ecoule = precedent ? Math.min(maintenant - precedent, 250) : 0
    precedent = maintenant
    if (simulation.lecture && ecoule > 0) {
      const t = simulation.temps + (ecoule / 1000) * VITESSE
      simulation.temps = t >= FIN ? DEBUT : t
      sale = true
    }
    const tranche = trancheDe(simulation.temps)
    void charger(tranche)
    // Dix minutes avant l'heure suivante, on la charge déjà.
    if (simulation.temps > debutTranche(tranche) + 3000) void charger(tranche + 1)
    const courses = heures.get(tranche)
    if (!sale || !courses) return
    sale = false

    const vehicules: Vehicule[] = []
    for (const c of courses) {
      const p = position(c, simulation.temps)
      if (p) vehicules.push({ lon: p[0], lat: p[1], mode: c.mode, couleur: c.couleur })
    }
    if (simulation.vehicules !== vehicules.length) simulation.vehicules = vehicules.length
    const sombre = ctx.sombre()
    calque?.dessiner(vehicules, { contour: encres(sombre).surface, bus: sombre ? terracotta[300] : terracotta[450] })
  }

  function demarrer() {
    if (image) return
    calque ??= creerCalque(carte)
    precedent = 0
    sale = true
    image = requestAnimationFrame(boucle)
  }

  function arreter() {
    cancelAnimationFrame(image)
    image = 0
    calque?.effacer()
  }

  // La boucle ne tourne que si l'on regarde les véhicules : pas de calcul ni de batterie perdus.
  watch(() => simulation.actif && ctx.vue() === 'offre', (voir) => (voir ? demarrer() : arreter()), { immediate: true })
  watch(ctx.sombre, () => (sale = true))
  carte.on('move', () => (sale = true))
  carte.on('resize', () => (sale = true))
}
