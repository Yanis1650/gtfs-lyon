import type { FeatureCollection, LineString, MultiLineString, Point, Polygon } from 'geojson'

export type Mode = 'metro' | 'tram' | 'trolleybus' | 'bus' | 'funiculaire' | 'navette_fluviale' | 'train'
export type Vue = 'offre' | 'vitesse' | 'acces'
export type IndicateurAcces = 'pop_tc30' | 'pop_tc45' | 'temps'

export interface ProprietesArret {
  id: string
  nom: string
  departs: number
  /** Départs par tranche horaire : indice 0 = 4 h-5 h … 23 = 3 h-4 h. */
  profil: number[]
  lignes: string[]
  mode: Mode
}

export interface ProprietesTroncon {
  de: string
  vers: string
  courses: number
  vitesse: number | null
  mode: Mode
  profil: number[]
  lignes: string[]
}

export interface ProprietesLigne {
  id: string
  ligne: string
  nom: string
  couleur: string
  mode: Mode
  courses: number
  vitesse: number | null
  longueur_km: number | null
  vitesses: Record<string, number>
}

export interface ProprietesCarreau {
  id: string
  pop: number
  pop_tc30: number
  pop_tc45: number
  pop_marche30: number
  [temps: `t_${string}`]: number | null
}

export interface Meta {
  date_reference: string
  heure_debut_service: number
  arrets: number
  departs: number
  courses: number
  km_commerciaux: number
  modes: { mode: Mode; lignes: number; courses: number; vitesse: number }[]
  poles: { id: string; nom: string; lat: number; lon: number }[]
  accessibilite?: { heure_depart: number; fenetre_min: number }
  sources: { nom: string; licence: string }[]
}

export type Arrets = FeatureCollection<Point, ProprietesArret>
export type Troncons = FeatureCollection<LineString, ProprietesTroncon>
export type Lignes = FeatureCollection<LineString | MultiLineString, ProprietesLigne>
export type Carreaux = FeatureCollection<Polygon, ProprietesCarreau>

const cache = new Map<string, Promise<unknown>>()

function charger<T>(fichier: string): Promise<T> {
  if (!cache.has(fichier)) {
    const url = `${import.meta.env.BASE_URL}data/${fichier}`
    cache.set(
      fichier,
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`${fichier} : ${r.status}`)
        return r.json()
      }),
    )
  }
  return cache.get(fichier) as Promise<T>
}

export const chargerMeta = () => charger<Meta>('meta.json')
export const chargerArrets = () => charger<Arrets>('arrets.geojson')
export const chargerTroncons = () => charger<Troncons>('troncons.geojson')
export const chargerLignes = () => charger<Lignes>('lignes.geojson')
export const chargerCarreaux = () => charger<Carreaux>('carreaux.geojson')

/** Courses en circulation pendant une heure : [ligne, arrêts, heure du premier, écarts en s]. */
export interface HeureVehicules {
  debut: number
  courses: [string, string[], number, number[]][]
}
/** `heure` : l'heure de début, « 08h » pour 8 h-9 h (fichiers produits par la chaîne). */
export const chargerVehicules = (heure: string) => charger<HeureVehicules>(`vehicules/${heure}.json`)

export const LIBELLES_MODES: Record<Mode, string> = {
  metro: 'Métro',
  tram: 'Tramway',
  trolleybus: 'Trolleybus',
  bus: 'Bus',
  funiculaire: 'Funiculaire',
  navette_fluviale: 'Navette fluviale',
  train: 'Train',
}

export const LIBELLES_PERIODES: Record<string, string> = {
  pointe_matin: 'Pointe du matin (7 h-9 h)',
  creuse: 'Heures creuses (10 h-16 h)',
  pointe_soir: 'Pointe du soir (17 h-19 h)',
  soiree: 'Soirée (20 h-minuit)',
}
