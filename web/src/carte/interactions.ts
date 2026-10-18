// Survol (bulle d'information) et clic (sélection) sur les couches de l'atlas.
import { type Map as CarteMapLibre, type MapGeoJSONFeature, Popup } from 'maplibre-gl'

import type { IndicateurAcces, ProprietesArret, ProprietesCarreau, ProprietesTroncon, Vue } from '../donnees'
import { kmh, minutes, nombre, part, tranche } from '../format'
import { COUCHES_PAR_VUE } from './couches'
import { isochrones } from '../etat/isochrones'

export interface Contexte {
  vue: () => Vue
  heure: () => number
  indicateur: () => IndicateurAcces
  pole: () => string
  nomPole: () => string
  population: () => number
}

export interface Rappels {
  arret: (a: ProprietesArret | null) => void
  troncon: (t: ProprietesTroncon | null) => void
  carreau: (c: ProprietesCarreau | null) => void
}

/** Les textes viennent des données ouvertes : on les échappe avant de les mettre en HTML. */
export const echapper = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

// MapLibre aplatit les tableaux des propriétés en chaînes JSON.
const tableau = <T>(v: unknown): T[] => (typeof v === 'string' ? JSON.parse(v) : (v as T[]))

export function lireArret(f?: MapGeoJSONFeature): ProprietesArret | null {
  const p = f?.properties
  return p ? ({ ...p, profil: tableau<number>(p.profil), lignes: tableau<string>(p.lignes) } as ProprietesArret) : null
}

export function lireTroncon(f?: MapGeoJSONFeature): ProprietesTroncon | null {
  const p = f?.properties
  return p ? ({ ...p, profil: tableau<number>(p.profil), lignes: tableau<string>(p.lignes) } as ProprietesTroncon) : null
}

export function brancherInteractions(carte: CarteMapLibre, ctx: Contexte, rappels: Rappels): Popup {
  const bulle = new Popup({ closeButton: false, closeOnClick: false, offset: 10, maxWidth: '260px' })

  const textes: Record<string, (f: MapGeoJSONFeature) => string> = {
    'arrets-offre': (f) => {
      const a = lireArret(f)!
      return `<strong>${echapper(a.nom)}</strong><br>${nombre(a.profil[ctx.heure()])} départs, ${tranche(ctx.heure())}`
    },
    'troncons-vitesse': (f) => {
      const t = lireTroncon(f)!
      return `<strong>${kmh(t.vitesse ?? null)}</strong><br>${nombre(t.courses)} courses dans la journée`
    },
    carreaux: (f) => {
      const c = f.properties as ProprietesCarreau
      const indicateur = ctx.indicateur()
      if (indicateur === 'temps') return `${minutes(c[`t_${ctx.pole()}`] as number | null)} depuis ${echapper(ctx.nomPole())}`
      // Sans total connu, le nombre d'habitants plutôt qu'une part fausse.
      const total = ctx.population()
      const quantite =
        total > 0
          ? `<strong>${part(c[indicateur] / total)}</strong> des habitants de la Métropole`
          : `<strong>${nombre(c[indicateur])}</strong> habitants`
      return `${quantite} à moins de ${indicateur === 'pop_tc45' ? 45 : 30}&nbsp;min d’ici`
    },
  }

  const sortir = () => { carte.getCanvas().style.cursor = ''; bulle.remove() }
  // Éviter les recherches des couches masquées et laisser le suivi cadencé gérer les isochrones.
  carte.on('mousemove', (e) => {
    if (ctx.vue() === 'acces' && isochrones.actif) {
      carte.getCanvas().style.cursor = 'crosshair'
      return bulle.remove()
    }
    const couche = { offre: 'arrets-offre', vitesse: 'troncons-vitesse', acces: 'carreaux' }[ctx.vue()]
    if (!carte.getLayer(couche)) return sortir()
    const f = carte.queryRenderedFeatures(e.point, { layers: [couche] })[0]
    if (!f) return sortir()
    carte.getCanvas().style.cursor = 'pointer'
    bulle.setLngLat(e.lngLat).setHTML(textes[couche](f)).addTo(carte)
  })
  carte.on('mouseout', sortir)

  carte.on('click', (e) => {
    const vue = ctx.vue()
    if (vue === 'acces' && isochrones.actif) return
    const couches = COUCHES_PAR_VUE[vue].filter((id) => carte.getLayer(id))
    const f = carte.queryRenderedFeatures(e.point, { layers: couches })[0]
    const id = f?.layer.id
    if (vue === 'offre') rappels.arret(id === 'arrets-offre' ? lireArret(f) : null)
    if (vue === 'vitesse') rappels.troncon(id === 'troncons-vitesse' ? lireTroncon(f) : null)
    if (vue === 'acces') rappels.carreau(id === 'carreaux' ? (f.properties as ProprietesCarreau) : null)
  })

  return bulle
}
