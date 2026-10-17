// Véhicules en circulation d'après les horaires du jour de référence : horloge partagée par
// le panneau et la carte, et boucle d'animation qui place chaque véhicule à chaque image.
import type { Map as CarteMapLibre } from 'maplibre-gl'
import { reactive, watch } from 'vue'

import { encres } from '../carte/expressions'
import { chargerLignes, chargerTroncons, chargerVehicules, type ProprietesLigne, type Vue } from '../donnees'
import { terracotta } from '../palette'
import { creerCalque, type Vehicule } from '../simulation/calque'
import { silhouettes } from '../simulation/gabarits'
import { dessinerMaquettes, SOURCE_VEHICULES, ZOOM_MAQUETTES } from '../simulation/maquettes'
import { avancement, type Course, indexerTroncons, pointCourse, preparer, type Trace } from '../simulation/trajets'

/** Vitesses de lecture : temps réel, dix fois, soixante fois (une heure par minute). */
export const VITESSES = [1, 10, 60] as const
/** Le jour de service commence à 4 h et court jusqu'à 4 h le lendemain (28 h). */
const DEBUT = 4 * 3600
const FIN = DEBUT + 24 * 3600

export const simulation = reactive({
  actif: false,
  lecture: false,
  /** Secondes depuis minuit du jour de référence. */
  temps: 8 * 3600,
  vehicules: 0,
  /** Dix fois la réalité par défaut : assez vite pour voir le réseau vivre, assez lent pour suivre un tram. */
  vitesse: 10 as (typeof VITESSES)[number],
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
  // `sale` : l'heure a changé ou la vue s'est posée. `bouge` : la carte se déplace, la toile
  // suit à chaque image, les maquettes (géographiques) attendent qu'elle se pose.
  let sale = true
  let bouge = false
  let enMaquettes = false
  let maquettesAffichees = false
  let source: unknown = null

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
      const t = simulation.temps + (ecoule / 1000) * simulation.vitesse
      simulation.temps = t >= FIN ? DEBUT : t
      sale = true
    }
    const tranche = trancheDe(simulation.temps)
    void charger(tranche)
    // Dix minutes avant l'heure suivante, on la charge déjà.
    if (simulation.temps > debutTranche(tranche) + 3000) void charger(tranche + 1)
    const courses = heures.get(tranche)
    // De près, les véhicules prennent leur forme réelle (un peu plus tôt carte inclinée, où le
    // premier plan est plus proche que le centre) ; un style rechargé les redemande.
    const maquettes = carte.getZoom() + carte.getPitch() / 60 >= ZOOM_MAQUETTES
    if (maquettes !== enMaquettes || carte.getSource(SOURCE_VEHICULES) !== source) sale = true
    enMaquettes = maquettes
    source = carte.getSource(SOURCE_VEHICULES)
    if (!courses || !(sale || (bouge && !maquettes))) return
    sale = bouge = false
    const sombre = ctx.sombre()
    const bus = sombre ? terracotta[300] : terracotta[450]
    const vehicules = placer(courses, maquettes, bus)
    calque?.dessiner(maquettes ? [] : vehicules, { contour: encres(sombre).surface, bus })
  }

  /** Place chaque véhicule en circulation : un disque pour la toile, ou ses caisses de près. */
  function placer(courses: Course[], maquettes: boolean, bus: string): Vehicule[] {
    const vehicules: Vehicule[] = []
    const caisses: ReturnType<typeof silhouettes> = []
    // Les maquettes ne couvrent que la vue et ses abords : elles se recalculent quand elle se pose.
    const b = carte.getBounds()
    const [mx, my] = [(b.getEast() - b.getWest()) / 2, (b.getNorth() - b.getSouth()) / 2]
    let total = 0
    for (const c of courses) {
      const a = avancement(c, simulation.temps)
      if (!a) continue
      total++
      const [lon, lat] = pointCourse(c, a.k, a.d)
      if (!maquettes) vehicules.push({ lon, lat, mode: c.mode, couleur: c.couleur })
      else if (lon > b.getWest() - mx && lon < b.getEast() + mx && lat > b.getSouth() - my && lat < b.getNorth() + my)
        caisses.push(...silhouettes(c, a.k, a.d, c.mode === 'bus' || c.mode === 'trolleybus' ? bus : c.couleur))
    }
    if (simulation.vehicules !== total) simulation.vehicules = total
    // De loin, la source n'est vidée qu'une fois, au passage du seuil.
    if (maquettes || maquettesAffichees) {
      maquettesAffichees = maquettes
      if (!dessinerMaquettes(carte, caisses) && maquettes) sale = true
    }
    return vehicules
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
    dessinerMaquettes(carte, [])
    maquettesAffichees = false
  }

  // La boucle ne tourne que si l'on regarde les véhicules : pas de calcul ni de batterie perdus.
  watch(() => simulation.actif && ctx.vue() === 'offre', (voir) => (voir ? demarrer() : arreter()), { immediate: true })
  watch(ctx.sombre, () => (sale = true))
  carte.on('move', () => (bouge = true))
  carte.on('moveend', () => (sale = true))
  carte.on('resize', () => (sale = true))
}
