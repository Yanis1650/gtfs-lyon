import type { GeoJSONSource, Map } from 'maplibre-gl'
import { ardoise, terracotta, type Classe } from '../palette'
import type { TracesIsochrones } from './geometrie'

export const SOURCES_ISO = ['iso-zones', 'iso-contours', 'iso-depart'] as const
const VIDE = { type: 'FeatureCollection' as const, features: [] }
export const COULEURS_ISO = [terracotta[450], ardoise[600], ardoise[300]]

export const classesIsochrones = (): Classe[] => [
  { min: 0, libelle: '0 à 15 min', couleur: COULEURS_ISO[0] },
  { min: 15, libelle: '15 à 30 min', couleur: COULEURS_ISO[1] },
  { min: 30, libelle: '30 à 45 min', couleur: COULEURS_ISO[2] },
]

export function ajouterIsochrones(carte: Map, avant?: string) {
  for (const id of SOURCES_ISO) carte.addSource(id, { type: 'geojson', data: VIDE, attribution: '© SYTRAL Mobilités (ODbL) · © Insee' })
  carte.addLayer({ id: 'iso-zones', source: 'iso-zones', type: 'fill',
    paint: { 'fill-color': ['step', ['get', 'minutes'], COULEURS_ISO[0], 16, COULEURS_ISO[1], 31, COULEURS_ISO[2]],
      'fill-opacity': .45, 'fill-antialias': false } }, avant)
  carte.addLayer({ id: 'iso-contours', source: 'iso-contours', type: 'line',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-width': 2, 'line-opacity': .95,
      'line-color': ['match', ['get', 'minutes'], 15, COULEURS_ISO[0], 30, COULEURS_ISO[1], COULEURS_ISO[2]] } }, avant)
  carte.addLayer({ id: 'iso-depart', source: 'iso-depart', type: 'circle',
    paint: { 'circle-radius': 7, 'circle-color': terracotta[450], 'circle-stroke-color': '#fff', 'circle-stroke-width': 3 } })
}

export function afficherIsochrones(carte: Map, actif: boolean, traces?: TracesIsochrones | null) {
  if (!carte.getSource('iso-zones')) return
  for (const id of SOURCES_ISO) carte.setLayoutProperty(id, 'visibility', actif ? 'visible' : 'none')
  if (carte.getLayer('carreaux')) carte.setPaintProperty('carreaux', 'fill-opacity', actif ? (traces ? .03 : .15) : .85)
  if (carte.getLayer('carreaux-selection')) carte.setPaintProperty('carreaux-selection', 'line-opacity', actif ? 0 : 1)
  const geometries = [traces?.zones, traces?.contours, traces?.depart]
  SOURCES_ISO.forEach((id, i) => (carte.getSource(id) as GeoJSONSource).setData(geometries[i] ?? VIDE))
}
