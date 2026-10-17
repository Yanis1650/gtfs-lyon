// Gabarits des véhicules et leur silhouette au sol, caisse par caisse, le long de la voie :
// sur une courbe, chaque module d'un tram ou chaque voiture d'un métro prend son propre angle.
import type { Feature, Polygon } from 'geojson'

import type { Mode } from '../donnees'
import { type Course, pointCourse } from './trajets'

export interface Gabarit {
  /** Longueur de chaque caisse, de l'avant vers l'arrière, en mètres. */
  caisses: number[]
  largeur: number
  hauteur: number
  /** Décalage vers la droite du sens de marche, en mètres : les deux sens d'un bus partagent
   *  l'axe de la rue, quand trams et métros suivent déjà chacun leur voie. */
  decalage: number
  /** Métro et funiculaires roulent sous la ville : dessinés à plat, sans relief. */
  souterrain?: boolean
  /** Proue en pointe, pour la navette fluviale. */
  proue?: boolean
}

/** Propriétés lues par les couches : couleur, hauteur, et 1 pour un véhicule souterrain. */
export interface ProprietesCaisse {
  couleur: string
  hauteur: number
  souterrain: 0 | 1
}

// Ordres de grandeur du parc lyonnais : bus de 12 m, articulés de 18 m sur les lignes fortes C
// et les trolleybus, trams de 32 m en cinq modules, voitures de métro de 18 m.
const BUS: Gabarit = { caisses: [12], largeur: 2.55, hauteur: 3.1, decalage: 1.8 }
const ARTICULE: Gabarit = { ...BUS, caisses: [11.4, 6.6] }
const metro = (voitures: number): Gabarit => ({
  caisses: Array<number>(voitures).fill(18),
  largeur: 2.9,
  hauteur: 3.5,
  decalage: 0,
  souterrain: true,
})
const GABARITS: Record<Mode, Gabarit> = {
  bus: BUS,
  trolleybus: ARTICULE,
  tram: { caisses: [8.6, 4.4, 6, 4.4, 8.6], largeur: 2.4, hauteur: 3.3, decalage: 0 },
  metro: metro(2),
  funiculaire: { caisses: [16], largeur: 2.6, hauteur: 3.4, decalage: 0, souterrain: true },
  navette_fluviale: { caisses: [22], largeur: 4.6, hauteur: 2.6, decalage: 0, proue: true },
  train: { caisses: [26, 26, 26], largeur: 2.9, hauteur: 4.2, decalage: 0 },
}
const METRO_A = metro(3)

export function gabaritDe(mode: Mode, ligne: string): Gabarit {
  if (mode === 'metro' && ligne === 'A') return METRO_A
  if (mode === 'bus' && /^C\d/.test(ligne)) return ARTICULE
  return GABARITS[mode]
}

/** Mètres par degré de latitude ; la longitude est ramenée à la latitude de Lyon. */
const METRES = 111_200
const COS_LAT = Math.cos((45.76 * Math.PI) / 180)
/** Les tronçons mesurent leur longueur en degrés de latitude (voir trajets.ts). */
const enDegres = (m: number) => m / METRES
/** Jeu entre deux caisses, au droit de l'articulation. */
const JEU = 0.35

type Point = [number, number]

/** Contour d'une caisse dans son repère : a le long de la marche (0 à l'arrière), b vers la gauche.
 *  Sens antihoraire, comme le veut GeoJSON pour un contour extérieur. */
function contour(l: number, demi: number, avant: number, arriere: number, proue: boolean): Point[] {
  if (proue) {
    const epaule = l * 0.72
    return [[epaule, -demi], [l, 0], [epaule, demi], [arriere, demi], [0, demi - arriere], [0, -demi + arriere], [arriere, -demi]]
  }
  return [
    [l - avant, -demi], [l, -demi + avant], [l, demi - avant], [l - avant, demi],
    [arriere, demi], [0, demi - arriere], [0, -demi + arriere], [arriere, -demi],
  ]
}

/** Les caisses du véhicule dont l'avant se trouve à la distance d du début du tronçon k. */
export function silhouettes(course: Course, k: number, d: number, couleur: string): Feature<Polygon, ProprietesCaisse>[] {
  const g = gabaritDe(course.mode, course.ligne)
  const proprietes: ProprietesCaisse = { couleur, hauteur: g.hauteur, souterrain: g.souterrain ? 1 : 0 }
  const caisses: Feature<Polygon, ProprietesCaisse>[] = []
  let recul = 0
  g.caisses.forEach((longueur, i) => {
    const avant = pointCourse(course, k, d - enDegres(recul))
    const arriere = pointCourse(course, k, d - enDegres(recul + longueur))
    recul += longueur + JEU
    // Direction de la caisse, en mètres : de l'arrière vers l'avant.
    const ex = (avant[0] - arriere[0]) * COS_LAT * METRES
    const ey = (avant[1] - arriere[1]) * METRES
    const corde = Math.hypot(ex, ey)
    if (corde < 1) return
    const [ux, uy] = [ex / corde, ey / corde]
    // Chaque caisse garde sa longueur réelle, même si la corde d'une courbe est plus courte.
    const l = Math.max(corde, longueur * 0.9)
    const dernier = i === g.caisses.length - 1
    const forme = contour(l, g.largeur / 2, i === 0 ? 1 : 0.25, dernier ? 0.6 : 0.25, !!g.proue && i === 0)
    const anneau = forme.map(([a, b]): Point => {
      // b vers la gauche, décalage vers la droite : (−uy, ux) pointe à gauche du sens de marche.
      const mx = ux * a - uy * (b - g.decalage)
      const my = uy * a + ux * (b - g.decalage)
      return [arriere[0] + mx / (COS_LAT * METRES), arriere[1] + my / METRES]
    })
    anneau.push(anneau[0])
    caisses.push({ type: 'Feature', properties: proprietes, geometry: { type: 'Polygon', coordinates: [anneau] } })
  })
  return caisses
}
