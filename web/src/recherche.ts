/** Recherche tolérante aux accents, à la casse et aux séparateurs des noms d'arrêts. */
export function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('fr')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ').trim()
}

export function correspond(texte: string, requete: string): boolean {
  const contenu = normaliser(texte)
  return normaliser(requete).split(' ').every((mot) => contenu.includes(mot))
}
