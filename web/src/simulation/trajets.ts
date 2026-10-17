// Position d'un véhicule à un instant donné, le long des tronçons de la carte.
import type { HeureVehicules, Mode, ProprietesLigne, Troncons } from '../donnees'

type Point = [number, number]

/** Un tronçon prêt à parcourir : ses points et la distance cumulée à chacun. */
export interface Trace {
  points: Point[]
  cumul: number[]
}

export interface Course {
  mode: Mode
  couleur: string
  /** Heures de passage aux arrêts, en secondes depuis minuit (au-delà de 24 h après minuit). */
  heures: number[]
  /** Tronçon entre l'arrêt k et le suivant. */
  traces: (Trace | null)[]
}

/** Un véhicule s'arrête au plus 20 s, et au plus le quart du temps qui le sépare du prochain arrêt. */
const PAUSE_MAX = 20
const PART_PAUSE = 0.25

/** Distances en degrés, la longitude ramenée à la latitude de Lyon : seul le rapport compte. */
const COS_LAT = Math.cos((45.76 * Math.PI) / 180)

export function indexerTroncons(troncons: Troncons): Map<string, Trace> {
  const index = new Map<string, Trace>()
  for (const f of troncons.features) {
    const points = f.geometry.coordinates as Point[]
    const cumul = [0]
    for (let i = 1; i < points.length; i++) {
      const dx = (points[i][0] - points[i - 1][0]) * COS_LAT
      const dy = points[i][1] - points[i - 1][1]
      cumul.push(cumul[i - 1] + Math.hypot(dx, dy))
    }
    index.set(`${f.properties.de}>${f.properties.vers}`, { points, cumul })
  }
  return index
}

/** Les courses d'une heure, reliées à leurs tronçons et aux couleurs de leurs lignes. */
export function preparer(
  heure: HeureVehicules,
  index: Map<string, Trace>,
  lignes: Map<string, ProprietesLigne>,
): Course[] {
  return heure.courses.map(([ligne, arrets, depart, ecarts]) => {
    const heures = [depart]
    for (const e of ecarts) heures.push(heures[heures.length - 1] + e)
    const infos = lignes.get(ligne)
    return {
      mode: infos?.mode ?? 'bus',
      couleur: infos?.couleur ?? '#5b7880',
      heures,
      traces: arrets.slice(1).map((vers, k) => index.get(`${arrets[k]}>${vers}`) ?? null),
    }
  })
}

/** Le point situé à la fraction `f` (0 à 1) de la longueur du tracé. */
export function pointSur({ points, cumul }: Trace, f: number): Point {
  const cible = f * cumul[cumul.length - 1]
  let bas = 0
  let haut = cumul.length - 1
  while (haut - bas > 1) {
    const milieu = (bas + haut) >> 1
    if (cumul[milieu] <= cible) bas = milieu
    else haut = milieu
  }
  const longueur = cumul[haut] - cumul[bas]
  const r = longueur > 0 ? (cible - cumul[bas]) / longueur : 0
  return [points[bas][0] + r * (points[haut][0] - points[bas][0]), points[bas][1] + r * (points[haut][1] - points[bas][1])]
}

/** Dernier arrêt dont l'heure est passée, parmi tous sauf le terminus. */
function arretPrecedent(heures: number[], t: number): number {
  let bas = 0
  let haut = heures.length - 2
  while (bas < haut) {
    const milieu = (bas + haut + 1) >> 1
    if (heures[milieu] <= t) bas = milieu
    else haut = milieu - 1
  }
  return bas
}

/** Où est le véhicule à l'instant t ? `null` s'il ne circule pas (pas parti ou arrivé).
 *  Il marque un court arrêt, puis accélère et freine en douceur jusqu'à l'arrêt suivant. */
export function position(course: Course, t: number): Point | null {
  const { heures, traces } = course
  if (t < heures[0] || t > heures[heures.length - 1]) return null
  const k = arretPrecedent(heures, t)
  const trace = traces[k]
  if (!trace) return null
  const duree = heures[k + 1] - heures[k]
  if (duree <= 0) return pointSur(trace, 1)
  const pause = Math.min(PAUSE_MAX, duree * PART_PAUSE)
  const u = Math.min(1, Math.max(0, (t - heures[k] - pause) / (duree - pause)))
  return pointSur(trace, u * u * (3 - 2 * u))
}
