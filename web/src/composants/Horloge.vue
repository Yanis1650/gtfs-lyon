<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'

import { arreterDefilement as arreter, minuterie } from '../etat/lecture'
import { debutTranche, simulation, trancheDe } from '../etat/simulation'
import { horaire, tranche } from '../format'

const heure = defineModel<number>({ required: true })

// Lecture : la journée défile d'une heure toutes les 0,9 s, jusqu'à ce qu'on reprenne la main.
function basculer() {
  // Véhicules affichés : la lecture fait avancer leur horloge en continu.
  if (simulation.actif) {
    simulation.lecture = !simulation.lecture
    return
  }
  if (minuterie.value != null) return arreter()
  minuterie.value = window.setInterval(() => (heure.value = (heure.value + 1) % 24), 900)
}
onBeforeUnmount(arreter)

const enLecture = computed(() => (simulation.actif ? simulation.lecture : minuterie.value != null))
// Une valeur par minute simulée : l'affichage ne se redessine pas à chaque image.
const minute = computed(() => Math.floor(simulation.temps / 60))
const libelle = computed(() => (simulation.actif ? horaire(minute.value * 60) : tranche(heure.value)))
// L'horloge des véhicules entraîne le curseur des heures, et la carte des fréquences avec lui.
watch(
  () => (simulation.actif ? trancheDe(simulation.temps) : null),
  (t) => {
    if (t != null && t !== heure.value) heure.value = t
  },
)
function choisir(i: number) {
  arreter()
  heure.value = i
  if (simulation.actif) simulation.temps = debutTranche(i)
}

defineExpose({ arreter })
</script>

<template>
  <div class="horloge">
    <button
      class="horloge__lecture"
      :aria-label="enLecture ? 'Mettre en pause' : 'Faire défiler la journée'"
      @click="basculer"
    >
      <svg v-if="!enLecture" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" /></svg>
      <svg v-else viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" /></svg>
    </button>
    <div class="horloge__curseur">
      <div class="horloge__entete">
        <label for="heure" class="horloge__libelle chiffres">{{ libelle }}</label>
        <span class="horloge__contexte">{{ simulation.actif ? 'Animation simulée' : 'Horaires théoriques' }}</span>
      </div>
      <input
        id="heure"
        type="range"
        min="0"
        max="23"
        :value="heure"
        :aria-valuetext="tranche(heure)"
        @input="choisir(Number(($event.target as HTMLInputElement).value))"
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
  min-width: 0;
}
.horloge__entete {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.horloge__contexte {
  color: var(--discret);
  font-size: 12px;
}
.horloge__libelle {
  display: block;
  font-family: var(--police-titre);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
/* Curseur assez haut pour se saisir au doigt. */
input[type='range'] {
  width: 100%;
  height: 28px;
  margin: 0;
  accent-color: var(--terracotta);
}
</style>
