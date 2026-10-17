<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { arreterDefilement } from '../etat/lecture'
import { debutTranche, simulation, VITESSES } from '../etat/simulation'
import { nombre } from '../format'
import Horloge from './Horloge.vue'

const heure = defineModel<number>('heure', { required: true })
const emit = defineEmits<{ hauteur: [number] }>()
const conteneur = ref<HTMLElement>()
let observation: ResizeObserver | undefined
onMounted(() => {
  observation = new ResizeObserver(([entree]) => emit('hauteur', entree.target.getBoundingClientRect().height))
  observation.observe(conteneur.value!)
})

function basculerVehicules() {
  arreterDefilement()
  simulation.actif = !simulation.actif
  simulation.temps = debutTranche(heure.value)
  simulation.lecture = simulation.actif && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
onBeforeUnmount(() => { simulation.lecture = false; observation?.disconnect() })
</script>

<template>
  <section ref="conteneur" class="barre-temps" aria-label="Explorer la journée">
    <Horloge v-model="heure" />
    <div class="barre-temps__options">
      <button class="barre-temps__animation" :aria-pressed="simulation.actif" @click="basculerVehicules">
        <span class="barre-temps__voyant" aria-hidden="true" /> Animer les véhicules
      </button>
      <div v-if="simulation.actif" class="barre-temps__vitesses" role="group" aria-label="Vitesse de lecture">
        <button v-for="v in VITESSES" :key="v" :aria-pressed="simulation.vitesse === v" @click="simulation.vitesse = v">
          ×{{ v }}
        </button>
      </div>
      <span class="barre-temps__note">{{ simulation.actif ? `${nombre(simulation.vehicules)} véhicules simulés` : 'Sans retards ni perturbations' }}</span>
    </div>
  </section>
</template>

<style scoped>
.barre-temps {
  padding: 14px 18px 10px;
  background: var(--surface);
  border: 1px solid var(--filet);
  border-radius: var(--rayon);
  box-shadow: var(--ombre-douce);
}
.barre-temps__options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px solid var(--filet);
}
.barre-temps__animation {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 30px;
  padding: 3px 7px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--encre-2);
  font-size: 13px;
  cursor: pointer;
}
.barre-temps__animation[aria-pressed='true'] {
  background: var(--plan);
  color: var(--encre);
}
.barre-temps__voyant {
  width: 7px;
  height: 7px;
  border: 1px solid var(--discret);
  border-radius: 50%;
}
[aria-pressed='true'] .barre-temps__voyant {
  background: var(--terracotta);
  border-color: var(--terracotta);
}
.barre-temps__vitesses {
  display: flex;
  gap: 3px;
}
.barre-temps__vitesses button {
  min-width: 36px;
  min-height: 30px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
}
.barre-temps__vitesses button[aria-pressed='true'] {
  background: var(--ardoise);
  color: var(--sur-ardoise);
}
.barre-temps__note {
  margin-left: auto;
  font-size: 12px;
  color: var(--discret);
}
@media (max-width: 599px) {
  .barre-temps { padding: 10px 12px 7px; }
  .barre-temps__note { display: none; }
  .barre-temps__options { gap: 3px 5px; }
  .barre-temps__animation { font-size: 12px; }
}
@media (pointer: coarse) {
  .barre-temps__animation, .barre-temps__vitesses button { min-height: 40px; }
  .barre-temps__vitesses button { min-width: 40px; }
}
</style>
