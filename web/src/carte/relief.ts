// Vue satellite (photographies aériennes de l'IGN) et immeubles en relief.
import type { Map as CarteMapLibre, StyleSpecification } from 'maplibre-gl'

// Géoplateforme de l'IGN : orthophotographies en accès libre, sans clé (Licence Ouverte 2.0).
const ORTHO =
  'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS' +
  '&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}'

export const BATIMENTS = 'batiments-3d'

/** Fond satellite : la photographie remplace les aplats du plan, seuls les noms restent,
 *  en clair sur un halo sombre qui les détache de n'importe quel toit. */
export function habillerSatellite(style: StyleSpecification, sombre: boolean) {
  style.sources.ortho = {
    type: 'raster',
    tiles: [ORTHO],
    tileSize: 256,
    maxzoom: 19,
    attribution: '© IGN, BD ORTHO®',
  }
  const textes = style.layers.filter((c) => c.type === 'symbol')
  // Les cartouches des routes gardent leur texte sombre sur fond blanc.
  for (const c of textes.filter((t) => !t.id.includes('shield'))) {
    const peinture = (c.paint ??= {}) as Record<string, unknown>
    peinture['text-color'] = '#f7f2e6'
    peinture['text-halo-color'] = 'rgba(14, 24, 26, 0.85)'
  }
  style.layers = [
    ...style.layers.filter((c) => c.type === 'background'),
    {
      id: 'ortho',
      type: 'raster',
      source: 'ortho',
      // Image un peu éteinte : les couleurs des lignes et des véhicules restent devant.
      paint: { 'raster-saturation': -0.2, 'raster-brightness-max': sombre ? 0.62 : 0.86, 'raster-fade-duration': 150 },
    },
    ...textes,
  ]
}

/** Lumière fixée à la carte, venue du sud-ouest : les façades gardent leur ombre quand on tourne. */
export const LUMIERE: StyleSpecification['light'] = { anchor: 'map', position: [1.4, 210, 40], intensity: 0.42 }

interface Etat {
  sombre: boolean
  satellite: boolean
  relief: boolean
}

/** Immeubles extrudés à leur hauteur OpenStreetMap ; ils sortent de terre entre les zooms 13 et 15. */
export function ajouterBatiments(carte: CarteMapLibre, { sombre, satellite, relief }: Etat, avant?: string) {
  const monte = (champ: string, defaut: number) => [
    'interpolate', ['linear'], ['zoom'], 13, 0, 15, ['coalesce', ['get', champ], defaut],
  ]
  carte.addLayer(
    {
      id: BATIMENTS,
      type: 'fill-extrusion',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 13,
      layout: { visibility: relief ? 'visible' : 'none' },
      paint: {
        'fill-extrusion-color': satellite ? '#d9d4ca' : sombre ? '#243439' : '#ebe3cf',
        'fill-extrusion-height': monte('render_height', 8) as never,
        'fill-extrusion-base': monte('render_min_height', 0) as never,
        'fill-extrusion-opacity': satellite ? 0.88 : 1,
      },
    },
    avant,
  )
}

const animer = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Passe la carte en relief (inclinée, immeubles debout) ou la remet à plat, vue du nord. */
export function basculerRelief(carte: CarteMapLibre, relief: boolean) {
  if (carte.getLayer(BATIMENTS)) carte.setLayoutProperty(BATIMENTS, 'visibility', relief ? 'visible' : 'none')
  const duree = animer() ? 1200 : 0
  if (!relief) return carte.easeTo({ pitch: 0, bearing: 0, duration: duree })
  // Assez près pour que les immeubles et les véhicules prennent forme.
  carte.easeTo({ pitch: 58, bearing: carte.getBearing() || -18, zoom: Math.max(carte.getZoom(), 15.5), duration: duree })
}
