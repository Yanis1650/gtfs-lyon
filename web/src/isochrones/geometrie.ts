import type { FeatureCollection, MultiLineString, Point, Polygon, Position } from 'geojson'
import type { Carreaux } from '../donnees'

export interface Cellule {
  geometry: Polygon
  properties: { id: string; pop: number }
}
export interface TracesIsochrones {
  ids: string[]
  bandes: Uint8Array
  seuil: number
  contours: FeatureCollection<MultiLineString, { minutes: number }>
  depart: FeatureCollection<Point>
  habitants: number
  carreaux: number
}

interface Arete { a: Position; b: Position; gauche: number; droite: number }
const topologies = new WeakMap<Cellule[], { ids: string[]; centres: Position[]; aretes: Arete[] }>()

export function ordonner(carreaux: Carreaux, ids: string[]): Cellule[] {
  const parId = new Map(carreaux.features.map(f => [f.properties.id, f]))
  return ids.map(id => {
    const cellule = parId.get(id)
    if (!cellule) throw new Error('Les carreaux et les temps ne correspondent pas')
    return cellule
  })
}

/** La topologie ne dépend pas du départ : identifier les voisins une seule fois. */
function preparer(cellules: Cellule[]) {
  const existante = topologies.get(cellules)
  if (existante) return existante
  const parCle = new Map<string, Arete>()
  cellules.forEach((cellule, i) => {
    for (const anneau of cellule.geometry.coordinates) {
      for (let j = 0; j < anneau.length - 1; j++) {
        const a = anneau[j], b = anneau[j + 1]
        const cle = [a.join(','), b.join(',')].sort().join('|')
        const partagee = parCle.get(cle)
        if (partagee) partagee.droite = i
        else parCle.set(cle, { a, b, gauche: i, droite: -1 })
      }
    }
  })
  const resultat = { ids: cellules.map(c => c.properties.id), aretes: [...parCle.values()],
    centres: cellules.map(c => {
      const sommets = c.geometry.coordinates[0].slice(0, -1)
      return [0, 1].map(k => sommets.reduce((s, p) => s + p[k], 0) / sommets.length)
    }) }
  topologies.set(cellules, resultat)
  return resultat
}

/** Frontière exacte : les arêtes partagées disparaissent, les trous restent. */
export function frontiere(cellules: Cellule[], temps: Uint8Array, seuil: number): Position[][] {
  return preparer(cellules).aretes
    .filter(e => (temps[e.gauche] <= seuil) !== (e.droite >= 0 && temps[e.droite] <= seuil))
    .map(e => [e.a, e.b])
}

export function dessiner(cellules: Cellule[], temps: Uint8Array, origine: number, seuil: number): TracesIsochrones {
  if (temps.length !== cellules.length || !cellules[origine]) throw new Error('Origine ou matrice invalide')
  const { ids, centres, aretes } = preparer(cellules)
  const bandes = Uint8Array.from(temps, t => t <= 15 ? 1 : t <= 30 ? 2 : t <= 45 ? 3 : 4)
  const contours: TracesIsochrones['contours'] = { type: 'FeatureCollection', features: [] }
  let habitants = 0
  let carreaux = 0
  cellules.forEach((c, i) => {
    if (temps[i] > seuil) return
    habitants += c.properties.pop
    carreaux++
  })
  for (const minutes of [15, 30, 45].filter(t => t <= seuil)) {
    contours.features.push({ type: 'Feature', properties: { minutes },
      geometry: { type: 'MultiLineString', coordinates: [] } })
  }
  for (const e of aretes) {
    const a = bandes[e.gauche], b = e.droite < 0 ? 4 : bandes[e.droite]
    if (a === b) continue
    contours.features.forEach((f, i) => {
      if ((a <= i + 1) !== (b <= i + 1)) f.geometry.coordinates.push([e.a, e.b])
    })
  }
  return { ids, bandes, seuil, contours, habitants, carreaux,
    depart: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {},
      geometry: { type: 'Point', coordinates: centres[origine] } }] } }
}
