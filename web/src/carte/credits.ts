import { AttributionControl, type Map } from 'maplibre-gl'

/** Crédits natifs conservés, mais séparés de la légende et repliés au premier chargement. */
class CreditsReplies extends AttributionControl {
  onAdd(carte: Map): HTMLElement {
    const element = super.onAdd(carte)
    const bouton = element.querySelector<HTMLElement>('summary')
    bouton?.setAttribute('aria-label', 'Crédits cartographiques')
    bouton?.setAttribute('title', 'Crédits cartographiques')
    carte.once('load', () => {
      if (element.classList.contains('maplibregl-compact-show')) bouton?.click()
    })
    return element
  }
}

export function ajouterCredits(carte: Map) {
  carte.addControl(new CreditsReplies({ compact: true }), 'bottom-left')
}
