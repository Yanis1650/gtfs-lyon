<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

import { tranche } from '../format'

const heure = defineModel<number>({ required: true })

// Lecture : la journée défile d'une heure toutes les 0,9 s, jusqu'à ce qu'on reprenne la main.
const minuterie = ref<number | null>(null)
function basculer() {
  if (minuterie.value != null) return arreter()
  minuterie.value = window.setInterval(() => (heure.value = (heure.value + 1) % 24), 900)
}
function arreter() {
  if (minuterie.value != null) window.clearInterval(minuterie.value)
  minuterie.value = null
}
onBeforeUnmount(arreter)

defineExpose({ arreter })
</script>

<template>
  <div class="horloge">
    <button
      class="horloge__lecture"
      :aria-label="minuterie != null ? 'Mettre en pause' : 'Faire défiler la journée'"
      @click="basculer"
    >
      <svg v-if="minuterie == null" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" /></svg>
      <svg v-else viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" /></svg>
    </button>
    <div class="horloge__curseur">
      <label for="heure" class="horloge__libelle chiffres">{{ tranche(heure) }}</label>
      <input
        id="heure"
        type="range"
        min="0"
        max="23"
        :value="heure"
        :aria-valuetext="tranche(heure)"
        @input="arreter(); heure = Number(($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<style scoped>
.horloge {
  display: flex;
  align-items: center;
  gap: 14px;
}
.horloge__lecture {
  flex: none;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: var(--rayon);
  background: var(--ardoise);
  color: var(--sur-ardoise);
  display: grid;
  place-items: center;
  cursor: pointer;
}
.horloge__lecture:hover {
  background: var(--ardoise-survol);
}
.horloge__lecture svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
.horloge__curseur {
  flex: 1;
}
.horloge__libelle {
  display: block;
  font-family: var(--police-titre);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
/* Curseur assez haut pour se saisir au doigt. */
input[type='range'] {
  width: 100%;
  height: 28px;
  margin: 0;
  accent-color: var(--ardoise);
}
</style>
