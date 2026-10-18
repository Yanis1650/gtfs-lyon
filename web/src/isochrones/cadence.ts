/** Garde le dernier mouvement ; un mouvement continu ne repousse jamais l'échéance. */
export function cadencer<T>(appliquer: (valeur: T) => void, intervalle = 40) {
  let attente: T | undefined
  let minuterie: ReturnType<typeof setTimeout> | undefined
  let dernier = -Infinity
  function executer() {
    minuterie = undefined
    const valeur = attente
    attente = undefined
    dernier = performance.now()
    if (valeur !== undefined) appliquer(valeur)
  }
  return {
    recevoir(valeur: T) {
      attente = valeur
      if (minuterie !== undefined) return
      const delai = Math.max(0, intervalle - (performance.now() - dernier))
      if (!delai) executer()
      else minuterie = setTimeout(executer, delai)
    },
    annuler() {
      clearTimeout(minuterie)
      minuterie = attente = undefined
      dernier = -Infinity
    },
  }
}
