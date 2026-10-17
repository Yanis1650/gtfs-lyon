import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/** Un déplacement horizontal franc, distinct du défilement vertical et d’un simple toucher. */
export const estRetourCarte = (dx: number, dy: number, duree: number) =>
  Math.abs(dx) >= 70 && Math.abs(dx) > Math.abs(dy) * 1.7 && duree < 900

export function useRetourCarte(conteneur: Ref<HTMLElement | undefined>, exploration: Ref<boolean>) {
  let depart: { x: number; y: number; instant: number; id: number } | null = null
  const annuler = () => { depart = null }
  function commencer(e: TouchEvent) {
    depart = null
    if (e.touches.length !== 1 || !exploration.value || !window.matchMedia('(max-width: 899px)').matches) return
    if ((e.target as Element).closest('input, select, textarea, button, a, summary, svg, [role="slider"]')) return
    const t = e.touches[0]
    depart = { x: t.clientX, y: t.clientY, instant: Date.now(), id: t.identifier }
  }
  function terminer(e: TouchEvent) {
    const t = Array.from(e.changedTouches).find((t) => t.identifier === depart?.id)
    if (depart && t && e.touches.length === 0 && estRetourCarte(t.clientX - depart.x, t.clientY - depart.y, Date.now() - depart.instant)) {
      exploration.value = false
    }
    depart = null
  }
  onMounted(() => {
    conteneur.value?.addEventListener('touchstart', commencer, { passive: true })
    conteneur.value?.addEventListener('touchend', terminer, { passive: true })
    conteneur.value?.addEventListener('touchcancel', annuler, { passive: true })
  })
  onBeforeUnmount(() => {
    conteneur.value?.removeEventListener('touchstart', commencer)
    conteneur.value?.removeEventListener('touchend', terminer)
    conteneur.value?.removeEventListener('touchcancel', annuler)
  })
}
