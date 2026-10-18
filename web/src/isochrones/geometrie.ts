import type { FeatureCollection, MultiLineString, Point, Polygon, Position } from 'geojson'
import type { Carreaux } from '../donnees'

export interface Cellule {
  geometry: Polygon
  properties: { id: string; pop: number }
}
export interface TracesIsochrones {
  zones: FeatureCollection<Polygon, { minutes: number }>
  contours: FeatureCollection<MultiLineString, { minutes: number }>
  depart: FeatureCollection<Point>
  habitants: number
  carreaux: number
}

export function ordonner(carreaux: Carreaux, ids: string[]): Cellule[] {
  const parId = new Map(carreaux.features.map(f => [f.properties.id, f]))
  return ids.map(id => {
    const cellule = parId.get(id)
    if (!cellule) throw new Error('Les carreaux et les temps ne correspondent pas')
    return cellule
  })
}

/** Frontière exacte des carreaux retenus : les arêtes partagées disparaissent, les trous restent. */
export function frontiere(cellules: Cellule[], temps: Uint8Array, seuil: number): Position[][] {
  const aretes = new Map<string, [Position, Position]>()
  cellules.forEach((cellule, i) => {
    if (temps[i] > seuil) return
    for (const anneau of cellule.geometry.coordinates) {
      for (let j = 0; j < anneau.length - 1; j++) {
        const a = anneau[j], b = anneau[j + 1]
        const cle = [a.join(','), b.join(',')].sort().join('|')
        if (aretes.has(cle)) aretes.delete(cle)
        else aretes.set(cle, [a, b])
      }
    }
  })
  return [...aretes.values()]
}

export function dessiner(cellules: Cellule[], temps: Uint8Array, origine: number, seuil: number): TracesIsochrones {
  if (temps.length !== cellules.length || !cellules[origine]) throw new Error('Origine ou matrice invalide')
  const zones: TracesIsochrones['zones'] = { type: 'FeatureCollection', features: [] }
  const contours: TracesIsochrones['contours'] = { type: 'FeatureCollection', features: [] }
  let habitants = 0
  cellules.forEach((c, i) => {
    if (temps[i] > seuil) return
    habitants += c.properties.pop
    zones.features.push({ type: 'Feature', geometry: c.geometry, properties: { minutes: temps[i] } })
  })
  for (const minutes of [15, 30, 45].filter(t => t <= seuil)) {
    contours.features.push({ type: 'Feature', properties: { minutes },
      geometry: { type: 'MultiLineString', coordinates: frontiere(cellules, temps, minutes) } })
  }
  const sommets = cellules[origine].geometry.coordinates[0].slice(0, -1)
  const centre = [0, 1].map(k => sommets.reduce((s, p) => s + p[k], 0) / sommets.length)
  return { zones, contours, habitants, carreaux: zones.features.length,
    depart: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {},
      geometry: { type: 'Point', coordinates: centre } }] } }
}
