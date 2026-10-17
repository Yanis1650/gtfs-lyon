<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { basculerVehicules } from '../etat/lecture'
import { simulation, VITESSES } from '../etat/simulation'
import { nombre } from '../format'
import Horloge from './Horloge.vue'

const heure = defineModel<number>('heure', { required: true })
const emit = defineEmits<{ hauteur: [number] }>()
const conteneur = ref<HTMLElement>()
const options = ref(false)
const reglages = ref<HTMLButtonElement>()
let observation: ResizeObserver | undefined
function fermerAuClavier() { options.value = false; reglages.value?.focus() }
function fermerOptions(e: PointerEvent) {
  if (!conteneur.value?.contains(e.target as Node)) options.value = false
}
onMounted(() => {
  observation = new ResizeObserver(([entree]) => emit('hauteur', entree.target.getBoundingClientRect().height))
  observation.observe(conteneur.value!)
  document.addEventListener('pointerdown', fermerOptions)
})
onBeforeUnmount(() => {
  simulation.lecture = false
  observation?.disconnect()
  document.removeEventListener('pointerdown', fermerOptions)
})
</script>

<template>
  <section ref="conteneur" class="barre-temps" aria-label="Explorer la journée" @keydown.esc="fermerAuClavier">
    <Horloge v-model="heure" class="barre-temps__horloge" />
    <div class="barre-temps__options">
      <button ref="reglages" class="barre-temps__reglages" :aria-expanded="options" aria-controls="options-vehicules" aria-label="Options d’animation" title="Options d’animation" @click="options = !options">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 17h16M8 4v6M16 14v6" /></svg>
        <span v-if="simulation.actif" class="barre-temps__voyant" aria-label="Véhicules animés" />
      </button>
      <div v-if="options" id="options-vehicules" class="barre-temps__menu" role="group" aria-label="Animation des véhicules">
        <p class="barre-temps__titre">Animation des véhicules</p>
        <button class="barre-temps__animation" :aria-pressed="simulation.actif" :aria-label="simulation.actif ? 'Désactiver les véhicules' : 'Animer les véhicules'" @click="basculerVehicules(heure)">
          {{ simulation.actif ? 'Désactiver les véhicules' : 'Animer les véhicules' }}
        </button>
        <div v-if="simulation.actif" class="barre-temps__vitesses" role="group" aria-label="Vitesse de lecture">
          <button v-for="v in VITESSES" :key="v" :aria-pressed="simulation.vitesse === v" @click="simulation.vitesse = v">
            ×{{ v }}
          </button>
        </div>
        <p v-if="simulation.actif" class="barre-temps__note">{{ nombre(simulation.vehicules) }} véhicules simulés.</p>
        <p class="barre-temps__note">Horaires théoriques, sans retards ni perturbations. Couleurs des lignes ; bus en terracotta.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.barre-temps {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  padding-inline: max(6px, env(safe-area-inset-left, 0px)) max(6px, env(safe-area-inset-right, 0px));
  border-top: 1px solid var(--filet);
  background: var(--surface);
}
.barre-temps__horloge { flex: 1; }
.barre-temps__options { flex: none; }
.barre-temps__reglages {
  position: relative;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  list-style: none;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
  color: var(--encre-2);
}
.barre-temps__reglages:hover, .barre-temps__reglages[aria-expanded='true'] { background: var(--plan); color: var(--encre); }
.barre-temps__reglages svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; }
.barre-temps__voyant { position: absolute; right: 6px; top: 7px; width: 5px; height: 5px; border-radius: 50%; background: var(--terracotta); }
.barre-temps__menu {
  position: absolute;
  right: 8px;
  bottom: calc(100% + 8px);
  width: 264px;
  max-width: calc(100vw - 24px);
  max-height: min(320px, calc(100dvh - 230px));
  overflow-y: auto;
  padding: 14px;
  border: 1px solid var(--filet);
  border-radius: var(--rayon);
  background: var(--surface);
  box-shadow: var(--ombre-levee);
}
.barre-temps__titre { font-size: 14px; font-weight: 500; }
.barre-temps__animation, .barre-temps__vitesses button {
  min-height: 44px;
  padding: 6px 10px;
  border: 1px solid var(--filet);
  border-radius: 5px;
  background: var(--surface);
  color: var(--encre-2);
  font-size: 13px;
  cursor: pointer;
}
.barre-temps__animation { width: 100%; margin-top: 10px; }
.barre-temps__vitesses { display: flex; gap: 6px; margin-top: 8px; }
.barre-temps__vitesses button { flex: 1; }
button[aria-pressed='true'] { background: var(--ardoise); color: var(--sur-ardoise); border-color: var(--ardoise); }
.barre-temps__note { margin-top: 8px; font-size: 12px; color: var(--discret); }
@media (min-width: 900px) {
  .barre-temps { border: 1px solid var(--filet); border-radius: var(--rayon); box-shadow: var(--ombre-douce); }
}
</style>
