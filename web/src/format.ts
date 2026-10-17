// Typographie française : espace insécable entre un nombre et son unité, et avant « % ».
const NBSP = ' '
const entier = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

// Séparateur de milliers : espace insécable ordinaire, que toutes les polices dessinent
// (IBM Plex n'a pas l'espace fine insécable qu'emploie Intl).
export const nombre = (n: number) => entier.format(n).replace(/ /g, NBSP)
export const kmh = (v: number | null) => (v == null ? 'non mesurée' : `${decimal.format(v)}${NBSP}km/h`)
export const pourcent = (x: number) => `${nombre(Math.round(x * 100))}${NBSP}%`
/** Une part : une décimale sous 10 %, où l'arrondi à l'unité écraserait les écarts. */
export const part = (x: number) => (x < 0.1 ? `${decimal.format(x * 100)}${NBSP}%` : pourcent(x))

/** Heure de début d'une tranche du jour de service (0 = 4 h). */
export function heure(i: number, debut = 4): string {
  return `${(debut + i) % 24}${NBSP}h`
}

/** Libellé d'une tranche horaire du jour de service : « 8 h-9 h ». */
export function tranche(i: number, debut = 4): string {
  return `${heure(i, debut)}-${heure(i + 1, debut)}`
}

export function dateLongue(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function minutes(t: number | null | undefined): string {
  if (t == null) return 'plus d’une heure et demie'
  if (t < 60) return `${Math.round(t)}${NBSP}min`
  const h = Math.floor(t / 60)
  const m = Math.round(t % 60)
  return m ? `${h}${NBSP}h${NBSP}${String(m).padStart(2, '0')}` : `${h}${NBSP}h`
}
