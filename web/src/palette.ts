// Rampes de couleur de la charte Drekky Studio. L'ardoise et le crème viennent des jetons
// de la charte ; la rampe terracotta a été calculée aux mêmes clartés OKLCH que l'ardoise,
// en reprenant tels quels le terracotta (450) et le terracotta fort (500) de la charte.

export const ardoise = {
  50: '#f2f5f5', 100: '#e3eaeb', 200: '#c6d5d7', 300: '#a8bec3', 400: '#7a9199', 500: '#5b7880',
  600: '#3c565d', 700: '#334a50', 800: '#2b3d42', 900: '#233237', 950: '#162225',
} as const

export const terracotta = {
  100: '#ffe1d6', 200: '#fec2ab', 300: '#eda68b', 400: '#c57455', 450: '#bc6a4a', 500: '#a0553f',
  600: '#7b3e25', 700: '#6c331d', 800: '#5c2914',
} as const

export const creme = {
  100: '#f7f2e6', 200: '#efe6d1', 300: '#e4d8bc', 400: '#dcd3bd', 500: '#c9bb9b', 600: '#ab9a75',
  700: '#8b7c5d', 800: '#6d614a', 900: '#4f463a',
} as const

export interface Classe {
  /** Borne basse incluse ; la classe court jusqu'à la borne basse suivante. */
  min: number
  libelle: string
  couleur: string
}

const classes = (bornes: number[], libelles: string[], couleurs: string[]): Classe[] =>
  bornes.map((min, i) => ({ min, libelle: libelles[i], couleur: couleurs[i] }))

// Séparateur de milliers français (espace fine insécable).
const milliers = (n: number) => n.toLocaleString('fr-FR').replace(/ /g, ' ')
const NBSP = ' '

/** Courses par heure sur un tronçon, dans un sens. Séquentiel ardoise, du clair au foncé. */
export function classesFrequence(sombre: boolean): Classe[] {
  return classes(
    [1, 3, 6, 10, 15, 25],
    ['1 à 2', '3 à 5', '6 à 9', '10 à 14', '15 à 24', '25 et plus'],
    sombre
      ? [ardoise[600], ardoise[500], ardoise[400], ardoise[300], ardoise[200], ardoise[50]]
      : [ardoise[200], ardoise[300], ardoise[400], ardoise[500], ardoise[700], ardoise[950]],
  )
}

/** Vitesse commerciale (km/h). Divergent : terracotta plus lent, ardoise plus rapide, crème neutre. */
export function classesVitesse(sombre: boolean): Classe[] {
  return classes(
    [0, 10, 14, 18, 22, 28, 36],
    ['moins de 10', '10 à 14', '14 à 18', '18 à 22', '22 à 28', '28 à 36', '36 et plus'],
    // Le neutre est le plus clair (thème clair) ou le plus sombre (thème sombre) ; chaque
    // branche s'en éloigne en clarté à pas réguliers.
    sombre
      ? [terracotta[200], terracotta[300], terracotta[400], creme[800], ardoise[400], ardoise[300], ardoise[200]]
      : [terracotta[700], terracotta[500], terracotta[400], creme[500], ardoise[400], ardoise[600], ardoise[900]],
  )
}

/** Habitants joignables. Séquentiel ardoise. */
export function classesPopulation(sombre: boolean): Classe[] {
  // La moitié des carreaux joignent moins de 19 000 habitants en 30 min, le centre plus de 500 000.
  const bornes = [0, 10_000, 25_000, 50_000, 100_000, 200_000, 400_000]
  const libelles = bornes.map((b, i) =>
    i === 0
      ? `moins de ${milliers(bornes[1])}`
      : i === bornes.length - 1
        ? `${milliers(b)} et plus`
        : `${milliers(b)} à ${milliers(bornes[i + 1])}`,
  )
  return classes(
    bornes,
    libelles,
    sombre
      ? [ardoise[900], ardoise[800], ardoise[700], ardoise[600], ardoise[500], ardoise[300], ardoise[100]]
      : [ardoise[50], ardoise[200], ardoise[300], ardoise[400], ardoise[500], ardoise[700], ardoise[950]],
  )
}

/** Temps de trajet depuis un pôle (min). Séquentiel terracotta : plus c'est proche, plus c'est intense. */
export function classesTemps(sombre: boolean): Classe[] {
  return classes(
    [0, 15, 25, 35, 45, 60],
    [
      `moins de 15${NBSP}min`,
      `15 à 25${NBSP}min`,
      `25 à 35${NBSP}min`,
      `35 à 45${NBSP}min`,
      `45${NBSP}min à 1${NBSP}h`,
      `plus d’une heure`,
    ],
    sombre
      ? [terracotta[200], terracotta[300], terracotta[400], terracotta[600], terracotta[800], ardoise[900]]
      : [terracotta[800], terracotta[500], terracotta[450], terracotta[300], terracotta[100], creme[300]],
  )
}

/** Expression MapLibre « step » à partir d'une liste de classes. */
export function expressionClasses(valeur: unknown, liste: Classe[], defaut = 'rgba(0,0,0,0)'): unknown[] {
  const expr: unknown[] = ['step', valeur, defaut]
  for (const c of liste) expr.push(c.min, c.couleur)
  // « step » exige une première borne strictement supérieure à la valeur par défaut :
  // la classe qui commence à 0 remplace alors la couleur par défaut.
  if (liste[0].min === 0) {
    expr.splice(2, 3, liste[0].couleur)
  }
  return expr
}

/** Texte lisible (encre ou crème) sur une couleur de ligne officielle. */
export function encreSur(fond: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(fond.slice(i, i + 2), 16) / 255)
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const l = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return l > 0.4 ? '#1c2523' : '#f7f2e6'
}
