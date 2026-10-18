import { watch, type Ref } from 'vue'
import { demonstration, HEURE_DEMONSTRATION } from './demonstration'
import { arreterDefilement } from './lecture'
import { simulation, VITESSE_DEFAUT } from './simulation'

/** La scène se lance sur demande ; les contrôles habituels restent ensuite libres. */
export function useDecouverte(ctx: { heure: Ref<number>; relief: Ref<boolean>; exploration: Ref<boolean>; effacer?: () => void }) {
  watch(() => demonstration.demande, (demande) => {
    if (!demande) return
    arreterDefilement()
    ctx.effacer?.()
    ctx.heure.value = 4
    ctx.relief.value = true
    ctx.exploration.value = false
    simulation.temps = HEURE_DEMONSTRATION
    simulation.vitesse = VITESSE_DEFAUT
    simulation.actif = true
    simulation.lecture = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, { immediate: true })
}
