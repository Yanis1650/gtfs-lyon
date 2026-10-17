// Sources et couches de l'atlas, et leur mise à jour quand les réglages changent.
import type { Map as CarteMapLibre } from 'maplibre-gl'

import type { Arrets, Carreaux, Lignes, Troncons, Vue } from '../donnees'
import {
  couleurAcces,
  couleurVitesse,
  decalageSens,
  encres,
  filtreArrets,
  filtreId,
  filtreModes,
  filtreTronconsOffre,
  largeurVitesse,
  largeurZoom,
  peintureOffre,
  rayonArret,
  type Reglages,
} from './expressions'
import { premiereCoucheTexte } from './maplibre'

export const COUCHES_PAR_VUE: Record<Vue, string[]> = {
  offre: ['troncons-offre', 'arrets-offre', 'arrets-selection'],
  vitesse: ['troncons-vitesse', 'ligne-halo', 'ligne-trace'],
  acces: ['carreaux', 'carreaux-selection'],
}

export interface Donnees {
  arrets: Arrets
  troncons: Troncons
  lignes: Lignes
  carreaux: Carreaux | null
}

export interface Selection {
  ligne: string | null
  arret: string | null
  carreau: string | null
}

const VIDE: Carreaux = { type: 'FeatureCollection', features: [] }
const ARRONDI = { 'line-cap': 'round', 'line-join': 'round' } as const
// Crédits des données, affichés dans l'attribution de la carte quand la couche est visible.
const TCL = '© SYTRAL Mobilités (ODbL)'
const INSEE = '© Insee'

export function ajouterCouches(carte: CarteMapLibre, d: Donnees, r: Reglages, s: Selection) {
  const avant = premiereCoucheTexte(carte)
  const { encre, surface, selection } = encres(r.sombre)

  carte.addSource('troncons', { type: 'geojson', data: d.troncons, attribution: TCL })
  carte.addSource('lignes', { type: 'geojson', data: d.lignes, attribution: TCL })
  carte.addSource('arrets', { type: 'geojson', data: d.arrets, promoteId: 'id', attribution: TCL })
  carte.addSource('carreaux', { type: 'geojson', data: d.carreaux ?? VIDE, promoteId: 'id', attribution: `${INSEE} · ${TCL}` })

  carte.addLayer(
    { id: 'carreaux', type: 'fill', source: 'carreaux', paint: { 'fill-color': couleurAcces(r), 'fill-opacity': 0.85 } },
    avant,
  )
  carte.addLayer(
    {
      id: 'carreaux-selection',
      type: 'line',
      source: 'carreaux',
      filter: filtreId(s.carreau),
      paint: { 'line-color': encre, 'line-width': 2 },
    },
    avant,
  )
  carte.addLayer(
    {
      id: 'troncons-offre',
      type: 'line',
      source: 'troncons',
      filter: filtreTronconsOffre(r.heure),
      layout: ARRONDI,
      paint: { ...peintureOffre(r), 'line-offset': decalageSens },
    },
    avant,
  )
  carte.addLayer(
    {
      id: 'troncons-vitesse',
      type: 'line',
      source: 'troncons',
      filter: filtreModes(r.modes),
      layout: ARRONDI,
      paint: {
        'line-color': couleurVitesse(r.sombre),
        'line-width': largeurVitesse,
        'line-offset': decalageSens,
        'line-opacity': s.ligne ? 0.35 : 1,
      },
    },
    avant,
  )
  for (const [id, couleur, largeur] of [
    ['ligne-halo', surface, 9],
    ['ligne-trace', ['get', 'couleur'], 5],
  ] as const) {
    carte.addLayer(
      {
        id,
        type: 'line',
        source: 'lignes',
        filter: filtreId(s.ligne),
        layout: ARRONDI,
        paint: { 'line-color': couleur as string, 'line-width': largeurZoom(largeur) },
      },
      avant,
    )
  }
  // Disque clair cerclé d'encre, comme une station sur un plan de réseau.
  carte.addLayer({
    id: 'arrets-offre',
    type: 'circle',
    source: 'arrets',
    filter: filtreArrets(r.heure),
    paint: {
      'circle-radius': rayonArret(r.heure),
      'circle-color': surface,
      'circle-stroke-color': encre,
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 14, 1.6],
    },
  })
  carte.addLayer({
    id: 'arrets-selection',
    type: 'circle',
    source: 'arrets',
    filter: filtreId(s.arret),
    paint: {
      'circle-radius': rayonArret(r.heure, 4),
      'circle-color': 'rgba(0,0,0,0)',
      'circle-stroke-color': selection,
      'circle-stroke-width': 2.5,
    },
  })
}

export function montrerVue(carte: CarteMapLibre, vue: Vue) {
  for (const [v, couches] of Object.entries(COUCHES_PAR_VUE)) {
    for (const couche of couches) {
      if (carte.getLayer(couche)) carte.setLayoutProperty(couche, 'visibility', v === vue ? 'visible' : 'none')
    }
  }
}

export function appliquerHeure(carte: CarteMapLibre, r: Reglages) {
  const p = peintureOffre(r)
  carte.setPaintProperty('troncons-offre', 'line-color', p['line-color'])
  carte.setPaintProperty('troncons-offre', 'line-width', p['line-width'])
  carte.setFilter('troncons-offre', filtreTronconsOffre(r.heure))
  carte.setFilter('arrets-offre', filtreArrets(r.heure))
  carte.setPaintProperty('arrets-offre', 'circle-radius', rayonArret(r.heure))
  carte.setPaintProperty('arrets-selection', 'circle-radius', rayonArret(r.heure, 4))
}

export function appliquerSelection(carte: CarteMapLibre, s: Selection) {
  carte.setFilter('ligne-halo', filtreId(s.ligne))
  carte.setFilter('ligne-trace', filtreId(s.ligne))
  carte.setPaintProperty('troncons-vitesse', 'line-opacity', s.ligne ? 0.35 : 1)
  carte.setFilter('arrets-selection', filtreId(s.arret))
  carte.setFilter('carreaux-selection', filtreId(s.carreau))
}

export const appliquerModes = (carte: CarteMapLibre, r: Reglages) =>
  carte.setFilter('troncons-vitesse', filtreModes(r.modes))

export const appliquerAcces = (carte: CarteMapLibre, r: Reglages) =>
  carte.setPaintProperty('carreaux', 'fill-color', couleurAcces(r))

/** Emprise d'un tracé de ligne, pour y cadrer la carte. */
export function emprise(g: Lignes['features'][number]['geometry']): [number, number, number, number] {
  const points = (g.type === 'LineString' ? [g.coordinates] : g.coordinates).flat()
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
}
