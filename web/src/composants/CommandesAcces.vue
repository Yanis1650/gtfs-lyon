<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { IndicateurAcces, Meta } from '../donnees'

const props = defineProps<{ poles: Meta['poles'] }>()
const indicateur = defineModel<IndicateurAcces>('indicateur', { required: true })
const pole = defineModel<string>('pole', { required: true })
const ouverte = ref(true)
const mesureActive = computed(() => indicateur.value === 'temps'
  ? props.poles.find(p => p.id === pole.value)?.nom ?? 'Depuis un pôle'
  : indicateur.value === 'pop_tc45' ? '45 min' : '30 min')
const action = computed(() => ouverte.value
  ? 'Replier les commandes d’accessibilité'
  : `Afficher les commandes d’accessibilité : ${mesureActive.value}`)
const emit = defineEmits<{ hauteur: [number] }>()
const conteneur = ref<HTMLElement>()
let observation: ResizeObserver | undefined
onMounted(() => {
  observation = new ResizeObserver(([e]) => emit('hauteur', e.target.getBoundingClientRect().height))
  observation.observe(conteneur.value!)
})
onBeforeUnmount(() => observation?.disconnect())
const CHOIX: { id: IndicateurAcces; titre: string; aide: string }[] = [
  { id: 'pop_tc30', titre: '30 min', aide: 'Population joignable en 30 minutes' },
  { id: 'pop_tc45', titre: '45 min', aide: 'Population joignable en 45 minutes' },
  { id: 'temps', titre: 'Depuis un pôle', aide: 'Temps de trajet depuis un pôle' },
]
</script>

<template>
  <div ref="conteneur" class="acces-carte" :class="{ 'acces-carte--repliee': !ouverte }"
    role="group" aria-label="Mesure de l’accessibilité sur la carte">
    <button class="acces-carte__bascule" :aria-label="action" :title="action" :aria-expanded="ouverte"
      aria-controls="reglages-accessibilite-carte" @click="ouverte = !ouverte">
      <svg v-if="!ouverte" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
      </svg>
      <span v-if="!ouverte" class="acces-carte__mesure">{{ mesureActive }}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path :d="ouverte ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'" />
      </svg>
    </button>
    <div v-show="ouverte" id="reglages-accessibilite-carte">
      <div class="acces-carte__choix">
        <button v-for="c in CHOIX" :key="c.id" :aria-label="c.aide" :aria-pressed="indicateur === c.id"
          @click="indicateur = c.id">{{ c.titre }}</button>
      </div>
      <select v-if="indicateur === 'temps'" v-model="pole" aria-label="Pôle de départ sur la carte">
        <option v-for="p in poles" :key="p.id" :value="p.id">{{ p.nom }}</option>
      </select>
      <p>Touchez un carreau pour le détail.</p>
    </div>
  </div>
</template>

<style scoped>
.acces-carte {
  position: absolute;
  top: 64px;
  left: max(10px, env(safe-area-inset-left, 0px));
  z-index: 3;
  width: min(300px, calc(100% - 20px));
  padding: 3px;
  border: 1px solid var(--filet);
  border-radius: var(--rayon);
  background: var(--surface);
  box-shadow: var(--ombre-douce);
}
.acces-carte__choix { display: flex; gap: 3px; padding-right: 47px; }
button {
  flex: 1;
  min-height: 44px;
  padding: 5px 8px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--encre-2);
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
}
button:hover { background: var(--plan); }
button[aria-pressed='true'] { background: var(--ardoise); color: var(--sur-ardoise); }
.acces-carte__bascule {
  position: absolute;
  top: 3px;
  right: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 44px;
}
.acces-carte__bascule svg { flex-shrink: 0; }
.acces-carte__mesure { overflow: hidden; text-overflow: ellipsis; }
.acces-carte.acces-carte--repliee { width: fit-content; max-width: calc(100% - 20px); }
.acces-carte--repliee .acces-carte__bascule { position: static; width: auto; max-width: 280px; }
select {
  width: 100%;
  min-height: 44px;
  margin-top: 4px;
  padding: 7px 10px;
  border: 1px solid var(--filet);
  border-radius: 4px;
  color: var(--encre);
  background: var(--surface);
  font: 16px var(--police);
}
p { padding: 4px 7px 3px; color: var(--discret); font-size: 11px; }
@media (min-width: 600px) {
  .acces-carte { top: 10px; left: auto; right: 10px; width: 280px; }
}
@media (min-width: 900px) {
  .acces-carte { top: 14px; right: 24px; }
}
</style>
