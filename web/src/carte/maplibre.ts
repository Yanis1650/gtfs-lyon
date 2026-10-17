import { Map as CarteMapLibre, type MapOptions, Marker, setWorkerUrl, type StyleSpecification } from 'maplibre-gl'
// MapLibre 6 est livré en ESM seul : sans cette déclaration, Vite ne publie pas le
// worker et la carte reste vide, sans la moindre erreur dans la console.
import urlWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

import { habillerSatellite, LUMIERE } from './relief'
import { ajouterCredits } from './credits'

setWorkerUrl(urlWorker)

const STYLE_FOND = 'https://tiles.openfreemap.org/styles/positron'

export const LYON = { centre: [4.857, 45.757] as [number, number], zoom: 11.6 }

/** Couleurs du fond, aux teintes de la charte : crème et ardoise, ou ardoise profonde. */
const FOND = {
  clair: {
    terre: '#f7f2e6', parc: '#eee9da', habitat: '#f3eee2', bati: '#eee8d9', batiContour: '#e6dfcf',
    eau: '#c6d5d7', coursEau: '#a8bec3', route: '#fbf8f1', routeMineure: '#ebe3d0', bordure: '#dcd3bd',
    rail: '#d9d1be', limite: '#d3c8b2', texte: '#606f6a', texteFort: '#354b4c', texteEau: '#3c565d',
    halo: '#f7f2e6',
  },
  sombre: {
    terre: '#162225', parc: '#182729', habitat: '#18262a', bati: '#1d2c30', batiContour: '#233237',
    eau: '#0e181a', coursEau: '#2b3d42', route: '#2f4247', routeMineure: '#233237', bordure: '#1d2c30',
    rail: '#2b3d42', limite: '#33474d', texte: '#a8bec3', texteFort: '#e3eaeb', texteEau: '#7a9199',
    halo: '#162225',
  },
}

let fondBrut: Promise<StyleSpecification> | null = null

/** Style du fond de carte OpenFreeMap (Positron), recoloré aux teintes de la charte,
 *  ou réduit à ses noms par-dessus la photographie aérienne. */
export async function styleFond(sombre: boolean, satellite = false): Promise<StyleSpecification> {
  fondBrut ??= fetch(STYLE_FOND).then((r) => r.json() as Promise<StyleSpecification>)
  const style: StyleSpecification = structuredClone(await fondBrut)
  const c = sombre ? FOND.sombre : FOND.clair
  for (const couche of style.layers) {
    const id = couche.id
    const peinture = (couche.paint ??= {}) as Record<string, unknown>
    if (couche.type === 'background') peinture['background-color'] = c.terre
    else if (couche.type === 'fill') {
      if (id === 'water') peinture['fill-color'] = c.eau
      else if (id === 'park' || id.startsWith('landcover')) peinture['fill-color'] = c.parc
      else if (id === 'building') {
        peinture['fill-color'] = c.bati
        peinture['fill-outline-color'] = c.batiContour
      } else peinture['fill-color'] = id.startsWith('landuse') ? c.habitat : c.terre
    } else if (couche.type === 'line') {
      if (id === 'waterway') peinture['line-color'] = c.coursEau
      else if (id.startsWith('boundary')) peinture['line-color'] = c.limite
      else if (id.includes('dashline')) peinture['line-color'] = c.terre
      else if (id.startsWith('railway')) peinture['line-color'] = c.rail
      else if (id.includes('casing')) peinture['line-color'] = c.bordure
      else if (id.includes('minor') || id.includes('path') || id.includes('subtle') || id.includes('aeroway'))
        peinture['line-color'] = c.routeMineure
      else peinture['line-color'] = c.route
      if (id !== 'waterway') peinture['line-opacity'] = [
        'interpolate', ['linear'], ['zoom'], 10, id.includes('minor') || id.includes('casing') ? .3 : .55, 16, .85,
      ]
    } else if (couche.type === 'symbol') {
      peinture['text-color'] = id.startsWith('water')
        ? c.texteEau
        : /label_(city|town|village|country|state)/.test(id)
          ? c.texteFort
          : c.texte
      peinture['text-halo-color'] = c.halo
      if (/poi|housenumber|road_label/.test(id)) peinture['text-opacity'] = [
        'interpolate', ['linear'], ['zoom'], 11, .25, 15, .9,
      ]
    }
  }
  style.light = LUMIERE
  if (satellite) habillerSatellite(style, sombre)
  return style
}

export async function creerCarte(conteneur: HTMLElement, sombre: boolean, satellite: boolean, options: Partial<MapOptions> = {}) {
  const carte = new CarteMapLibre({
    container: conteneur,
    style: await styleFond(sombre, satellite),
    center: LYON.centre,
    // Sur téléphone, un cran plus large pour voir toute l'agglomération.
    zoom: conteneur.clientWidth < 500 ? LYON.zoom - 0.9 : LYON.zoom,
    minZoom: 9,
    // Jusqu'au zoom 19, où un bus mesure une trentaine de pixels.
    maxZoom: 19,
    attributionControl: false,
    ...options,
  })
  ajouterCredits(carte)
  return carte
}

/** Première couche de texte du fond : nos données passent dessous pour garder les noms lisibles. */
export function premiereCoucheTexte(carte: CarteMapLibre): string | undefined {
  return carte.getStyle().layers.find((c) => c.type === 'symbol')?.id
}

/** Repère du pôle de départ, dans la vue « temps depuis un pôle ». */
export function marqueurDePole(carte: CarteMapLibre, pole: { nom: string; lon: number; lat: number }): Marker {
  const el = document.createElement('div')
  el.className = 'marqueur-pole'
  el.title = pole.nom
  return new Marker({ element: el }).setLngLat([pole.lon, pole.lat]).addTo(carte)
}
