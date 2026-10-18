import type { GeoJSONSource, Map } from 'maplibre-gl'
import { ardoise, terracotta, type Classe } from '../palette'
import type { TracesIsochrones } from './geometrie'

const SOURCES_ISO = ['iso-contours', 'iso-depart'] as const
const COUCHES_ISO = ['iso-zones', ...SOURCES_ISO]
const VIDE = { type: 'FeatureCollection' as const, features: [] }
export const COULEURS_ISO = [terracotta[450], ardoise[600], ardoise[300]]
interface Rendu {
  source: GeoJSONSource
  actif: boolean
  traces?: TracesIsochrones | null
  coloration?: TracesIsochrones | null
}
const rendus = new WeakMap<Map, Rendu>()

export const classesIsochrones = (): Classe[] => [
  { min: 0, libelle: '0 à 15 min', couleur: COULEURS_ISO[0] },
  { min: 15, libelle: '15 à 30 min', couleur: COULEURS_ISO[1] },
  { min: 30, libelle: '30 à 45 min', couleur: COULEURS_ISO[2] },
]

export function ajouterIsochrones(carte: Map, avant?: string) {
  for (const id of SOURCES_ISO) carte.addSource(id, { type: 'geojson', data: VIDE, attribution: '© SYTRAL Mobilités (ODbL) · © Insee' })
  // La géométrie reste dans la source des carreaux ; seuls les changements de bande sont envoyés.
  carte.addLayer({ id: 'iso-zones', source: 'carreaux', type: 'fill',
    paint: { 'fill-color': ['match', ['coalesce', ['feature-state', 'iso-bande'], 4],
      1, COULEURS_ISO[0], 2, COULEURS_ISO[1], COULEURS_ISO[2]],
      'fill-opacity': 0, 'fill-opacity-transition': { duration: 0 }, 'fill-antialias': false } }, avant)
  carte.addLayer({ id: 'iso-contours', source: 'iso-contours', type: 'line',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-width': 2, 'line-opacity': .95,
      'line-color': ['match', ['get', 'minutes'], 15, COULEURS_ISO[0], 30, COULEURS_ISO[1], COULEURS_ISO[2]] } }, avant)
  carte.addLayer({ id: 'iso-depart', source: 'iso-depart', type: 'circle',
    paint: { 'circle-radius': 7, 'circle-color': terracotta[450], 'circle-stroke-color': '#fff', 'circle-stroke-width': 3 } })
}

export function afficherIsochrones(carte: Map, actif: boolean, traces?: TracesIsochrones | null) {
  const source = carte.getSource('carreaux') as GeoJSONSource | undefined
  if (!source || !carte.getLayer('iso-zones')) return
  const precedent = rendus.get(carte)
  const nouveau = precedent?.source !== source
  const coloration = nouveau ? undefined : precedent?.coloration
  const rendu = { source, actif, traces, coloration: traces ?? coloration }
  if (nouveau || precedent?.actif !== actif) {
    for (const id of COUCHES_ISO) carte.setLayoutProperty(id, 'visibility', actif ? 'visible' : 'none')
    if (carte.getLayer('carreaux-selection')) carte.setPaintProperty('carreaux-selection', 'line-opacity', actif ? 0 : 1)
  }
  if (nouveau || precedent?.actif !== actif || !!precedent?.traces !== !!traces) {
    carte.setPaintProperty('carreaux', 'fill-opacity', actif ? (traces ? .03 : .15) : .85)
  }
  if (nouveau || !!precedent?.traces !== !!traces || precedent?.traces?.seuil !== traces?.seuil) {
    carte.setPaintProperty('iso-zones', 'fill-opacity', traces
      ? ['case', ['<=', ['coalesce', ['feature-state', 'iso-bande'], 4], traces.seuil / 15], .45, 0] : 0)
  }
  if (!nouveau && precedent?.traces === traces) {
    rendus.set(carte, rendu)
    return
  }
  traces?.ids.forEach((id, i) => {
    const avant = nouveau ? 4 : coloration?.ids === traces.ids ? coloration.bandes[i] : undefined
    if (avant !== traces.bandes[i]) {
      carte.setFeatureState({ source: 'carreaux', id }, { 'iso-bande': traces.bandes[i] })
    }
  })
  const geometries = [traces?.contours, traces?.depart]
  SOURCES_ISO.forEach((id, i) => (carte.getSource(id) as GeoJSONSource).setData(geometries[i] ?? VIDE))
  rendus.set(carte, rendu)
}
