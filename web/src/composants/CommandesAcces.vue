<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { IndicateurAcces, Meta } from '../donnees'

defineProps<{ poles: Meta['poles'] }>()
const indicateur = defineModel<IndicateurAcces>('indicateur', { required: true })
const pole = defineModel<string>('pole', { required: true })
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
  <div ref="conteneur" class="acces-carte" role="group" aria-label="Mesure de l’accessibilité sur la carte">
    <div class="acces-carte__choix">
      <button v-for="c in CHOIX" :key="c.id" :aria-label="c.aide" :aria-pressed="indicateur === c.id"
        @click="indicateur = c.id">{{ c.titre }}</button>
    </div>
    <select v-if="indicateur === 'temps'" v-model="pole" aria-label="Pôle de départ sur la carte">
      <option v-for="p in poles" :key="p.id" :value="p.id">{{ p.nom }}</option>
    </select>
    <p>Touchez un carreau pour le détail.</p>
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
.acces-carte__choix { display: flex; gap: 3px; }
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
