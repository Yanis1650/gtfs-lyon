// Maquettes des véhicules : leur silhouette au sol, montée en volume par tranches (châssis,
// caisse, vitres, toit) pour qu'un tram se lise comme un tram dès qu'on incline la carte.
// Ce sont des couches de la carte : les immeubles en relief les masquent comme dans la rue.
import type { Feature, Polygon } from 'geojson'
import type { ExpressionSpecification, GeoJSONSource, Map as CarteMapLibre } from 'maplibre-gl'

import type { ProprietesCaisse } from './gabarits'

export const SOURCE_VEHICULES = 'vehicules'
/** En deçà, un bus ferait moins de dix pixels de long : la toile dessine des disques. */
export const ZOOM_MAQUETTES = 16.5

const hauteur: ExpressionSpecification = ['get', 'hauteur']
const couleur: ExpressionSpecification = ['get', 'couleur']
const sousToit: ExpressionSpecification = ['-', hauteur, 0.45]

export function ajouterMaquettes(carte: CarteMapLibre, sombre: boolean, avant?: string, sousBatiments?: string) {
  const vitrage = sombre ? '#0b1416' : '#26343a'
  carte.addSource(SOURCE_VEHICULES, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
    // Des caisses de 2,5 m de large : aucune simplification, peu de marge autour des tuiles.
    tolerance: 0,
    buffer: 16,
  })
  // Métros et funiculaires, sous la ville : à plat et translucides, cachés par les immeubles.
  carte.addLayer(
    {
      id: 'vehicules-souterrains',
      type: 'fill',
      source: SOURCE_VEHICULES,
      filter: ['==', ['get', 'souterrain'], 1],
      paint: { 'fill-color': couleur, 'fill-opacity': 0.75, 'fill-outline-color': vitrage },
    },
    sousBatiments,
  )
  const tranches: [string, number | ExpressionSpecification, number | ExpressionSpecification, string | ExpressionSpecification][] = [
    ['chassis', 0, 0.4, vitrage],
    ['caisse', 0.4, 1.15, couleur],
    ['vitres', 1.15, sousToit, vitrage],
    ['toit', sousToit, hauteur, couleur],
  ]
  for (const [nom, bas, haut, teinte] of tranches) {
    carte.addLayer(
      {
        id: `vehicules-${nom}`,
        type: 'fill-extrusion',
        source: SOURCE_VEHICULES,
        filter: ['==', ['get', 'souterrain'], 0],
        paint: {
          'fill-extrusion-color': teinte,
          'fill-extrusion-base': bas,
          'fill-extrusion-height': haut,
          // Un dégradé par tranche brouillerait la lecture : chaque face garde un ton uni.
          'fill-extrusion-vertical-gradient': false,
        },
      },
      avant,
    )
  }
}

/** Remplace les maquettes affichées ; `false` si la source n'existe pas (style en rechargement). */
export function dessinerMaquettes(carte: CarteMapLibre, caisses: Feature<Polygon, ProprietesCaisse>[]): boolean {
  const source = carte.getSource<GeoJSONSource>(SOURCE_VEHICULES)
  source?.setData({ type: 'FeatureCollection', features: caisses })
  return !!source
}
