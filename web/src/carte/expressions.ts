// Expressions MapLibre de chaque couche, en fonctions pures des réglages de la carte.
import type { ExpressionSpecification, FilterSpecification } from 'maplibre-gl'

import type { IndicateurAcces, Mode } from '../donnees'
import {
  classesFrequence,
  classesPopulation,
  classesTemps,
  classesVitesse,
  expressionClasses,
} from '../palette'

export interface Reglages {
  heure: number
  sombre: boolean
  modes: Mode[]
  indicateur: IndicateurAcces
  pole: string
}

const expr = (e: unknown) => e as ExpressionSpecification

/** Valeur de la tranche horaire choisie dans le profil (24 valeurs) d'un tronçon ou d'un arrêt. */
export const valeurHeure = (heure: number): ExpressionSpecification => ['at', heure, ['get', 'profil']]

/** Épaisseur qui suit le zoom ; le zoom n'est admis qu'en tête d'expression. */
export function largeurZoom(base: ExpressionSpecification | number): ExpressionSpecification {
  return ['interpolate', ['linear'], ['zoom'], 10, ['*', 0.45, base], 13, base, 16, ['*', 2.4, base]]
}

/** Chaque sens est décalé sur sa droite : les deux sens d'une rue restent lisibles. */
export const decalageSens: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 12, 0, 15, 2, 17, 4]

export function peintureOffre({ heure, sombre }: Reglages) {
  const v = valeurHeure(heure)
  return {
    'line-color': expr(expressionClasses(v, classesFrequence(sombre))),
    'line-width': largeurZoom(['interpolate', ['linear'], v, 1, 0.7, 6, 1.6, 15, 3, 30, 5]),
  }
}

export const filtreTronconsOffre = (heure: number): FilterSpecification => ['>', valeurHeure(heure), 0]

/** Vue d'ensemble : les grands arrêts (45 départs ou plus dans l'heure), 20 au zoom 12, tous au zoom 13. */
export function filtreArrets(heure: number): FilterSpecification {
  const v = valeurHeure(heure)
  return [
    'all',
    ['>', v, 0],
    ['any', ['>=', ['zoom'], 13], ['all', ['>=', ['zoom'], 12], ['>=', v, 20]], ['>=', v, 45]],
  ]
}

/** Rayon d'un arrêt selon ses départs dans l'heure ; `supplement` élargit l'anneau de sélection. */
export function rayonArret(heure: number, supplement = 0): ExpressionSpecification {
  const v = valeurHeure(heure)
  return [
    'interpolate', ['linear'], ['zoom'],
    10, ['interpolate', ['linear'], ['sqrt', v], 1, 0.6 + supplement, 15, 5 + supplement],
    14, ['interpolate', ['linear'], ['sqrt', v], 1, 2.5 + supplement, 15, 13 + supplement],
  ]
}

export function couleurVitesse(sombre: boolean): ExpressionSpecification {
  // Un tronçon sans vitesse publiée reste visible, dans la couleur des filets.
  return expr(expressionClasses(['coalesce', ['get', 'vitesse'], -1], classesVitesse(sombre), sombre ? '#33474d' : '#dcd3bd'))
}

export const largeurVitesse = largeurZoom(['interpolate', ['linear'], ['get', 'courses'], 1, 0.8, 50, 1.6, 200, 2.6, 600, 4])

export const filtreModes = (modes: Mode[]): FilterSpecification => ['in', ['get', 'mode'], ['literal', modes]]

export function couleurAcces({ indicateur, pole, sombre }: Reglages): ExpressionSpecification {
  if (indicateur === 'temps') {
    return expr(expressionClasses(['coalesce', ['get', `t_${pole}`], 999], classesTemps(sombre)))
  }
  return expr(expressionClasses(['get', indicateur], classesPopulation(sombre)))
}

export const filtreId = (id: string | null): FilterSpecification => ['==', ['get', 'id'], id ?? '']

/** Encre et papier de la charte, ou leurs inverses sur l'ardoise profonde. */
export const encres = (sombre: boolean) =>
  sombre
    ? { encre: '#f7f2e6', surface: '#162225', selection: '#eda68b' }
    : { encre: '#1c2523', surface: '#f7f2e6', selection: '#bc6a4a' }
