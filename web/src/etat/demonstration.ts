import { reactive } from 'vue'

/** Une seule scène autorisée dans l'URL, sans paramètres libres. */
export const ANCRE_DEMONSTRATION = 'offre-demo'
export const HEURE_DEMONSTRATION = 8 * 3600 + 30 * 60
export const demonstration = reactive({ demande: 0, cadrageEffectue: 0 })
export function demanderDemonstration() { demonstration.demande++ }
