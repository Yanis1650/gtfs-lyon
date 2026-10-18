<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { arreterDefilement as arreter, minuterie } from '../etat/lecture'
import { debutTranche, simulation, trancheDe } from '../etat/simulation'
import { horaire, tranche } from '../format'

const heure = defineModel<number>({ required: true })
const glissement = ref(false)
let reprendre = false

function commencer() {
  arreter()
  glissement.value = true
  reprendre = simulation.actif && simulation.lecture
  if (simulation.actif) simulation.lecture = false
}
function terminer() {
  if (!glissement.value) return
  glissement.value = false
  if (reprendre && simulation.actif) simulation.lecture = true
  reprendre = false
}
onMounted(() => {
  window.addEventListener('pointerup', terminer)
  window.addEventListener('pointercancel', terminer)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerup', terminer)
  window.removeEventListener('pointercancel', terminer)
})

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
// Horloge et curseur suivent la seconde simulée, sans redessiner pour les fractions de seconde.
const seconde = computed(() => Math.floor(simulation.temps))
const libelle = computed(() => (simulation.actif ? horaire(seconde.value, true) : tranche(heure.value)))
const position = computed(() => simulation.actif ? seconde.value : heure.value)
// L'horloge des véhicules entraîne le curseur des heures, et la carte des fréquences avec lui.
watch(
  () => (simulation.actif ? trancheDe(simulation.temps) : null),
  (t) => {
    if (t != null && t !== heure.value) heure.value = t
  },
)
function choisir(valeur: number) {
  arreter()
  if (simulation.actif) {
    simulation.temps = valeur
    heure.value = trancheDe(valeur)
  } else heure.value = valeur
}

function deplacer(e: KeyboardEvent) {
  if (!simulation.actif || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
  e.preventDefault()
  const pas = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 60 : -60
  choisir(Math.min(debutTranche(24) - 1, Math.max(debutTranche(0), position.value + pas)))
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
    <label for="heure" class="horloge__libelle chiffres">
      {{ libelle }}
      <span class="horloge__contexte">{{ simulation.actif ? `Simulation ×${simulation.vitesse}` : 'Théorique' }}</span>
    </label>
      <input
        id="heure"
        type="range"
        :min="simulation.actif ? debutTranche(0) : 0"
        :max="simulation.actif ? debutTranche(24) - 1 : 23"
        step="1"
        :value="position"
        :aria-valuetext="libelle"
        @pointerdown="commencer"
        @input="choisir(Number(($event.target as HTMLInputElement).value))"
        @keydown="deplacer"
      />
  </div>
</template>

<style scoped>
.horloge {
  display: grid;
  grid-template-columns: 44px auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.horloge__lecture {
  flex: none;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: var(--rayon);
  background: transparent;
  color: var(--ardoise);
  display: grid;
  place-items: center;
  cursor: pointer;
}
.horloge__lecture:hover {
  background: var(--plan);
}
.horloge__lecture svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
.horloge__contexte {
  display: block;
  color: var(--discret);
  font: 400 10px/1.3 var(--police);
}
.horloge__libelle {
  display: block;
  font-family: var(--police-titre);
  min-width: 68px;
  font-size: 15px;
  line-height: 1.3;
  font-weight: 600;
  letter-spacing: -0.02em;
}
/* Curseur assez haut pour se saisir au doigt. */
input[type='range'] {
  appearance: none;
  width: 100%;
  min-width: 0;
  height: 44px;
  margin: 0;
  background: transparent;
  cursor: pointer;
  touch-action: none;
}
input::-webkit-slider-runnable-track { height: 3px; background: var(--filet); border-radius: 2px; }
input::-moz-range-track { height: 3px; background: var(--filet); border-radius: 2px; }
input::-webkit-slider-thumb { appearance: none; width: 12px; height: 12px; margin-top: -4.5px; border: 0; border-radius: 50%; background: var(--terracotta); }
input::-moz-range-thumb { width: 12px; height: 12px; border: 0; border-radius: 50%; background: var(--terracotta); }
</style>
