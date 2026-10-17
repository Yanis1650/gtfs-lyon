<script setup lang="ts">
import { ref } from 'vue'

import type { Meta, ProprietesArret, ProprietesLigne } from '../donnees'
import { debutTranche, simulation, VITESSES } from '../etat/simulation'
import { nombre } from '../format'
import { classesFrequence } from '../palette'
import FicheArret from './FicheArret.vue'
import Horloge from './Horloge.vue'
import Legende from './Legende.vue'
import RechercheArret from './RechercheArret.vue'

defineProps<{
  meta: Meta
  sombre: boolean
  arret: ProprietesArret | null
  arrets: ProprietesArret[]
  plusDesservis: ProprietesArret[]
  lignes: Map<string, ProprietesLigne>
}>()
const heure = defineModel<number>('heure', { required: true })
const emit = defineEmits<{ choisirArret: [ProprietesArret | null] }>()

const horloge = ref<InstanceType<typeof Horloge>>()
const RYTHMES: Record<(typeof VITESSES)[number], string> = {
  1: 'à vitesse réelle',
  10: 'dix fois plus vite que la réalité',
  60: 'une heure par minute',
}
function choisirHeure(i: number) {
  horloge.value?.arreter()
  heure.value = i
  if (simulation.actif) simulation.temps = debutTranche(i)
}

// Les véhicules partent du début de l'heure choisie ; la lecture démarre d'elle-même,
// sauf si le système demande de limiter les animations.
function basculerVehicules() {
  horloge.value?.arreter()
  simulation.actif = !simulation.actif
  if (!simulation.actif) {
    simulation.lecture = false
    return
  }
  simulation.temps = debutTranche(heure.value)
  simulation.lecture = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
</script>

<template>
  <section class="panneau-vue">
    <p class="intro">
      Les traits montrent les passages dans l’heure&nbsp;; les disques, les départs aux arrêts.
      Cliquez un arrêt pour le détail.
    </p>

    <Horloge ref="horloge" v-model="heure" />
    <p class="note vehicules__precision">Horaires théoriques · Animation simulée, sans retards ni perturbations.</p>

    <div class="vehicules">
      <button class="puce" :aria-pressed="simulation.actif" @click="basculerVehicules">Animer les véhicules</button>
      <template v-if="simulation.actif">
        <div class="puces" role="group" aria-label="Vitesse de lecture">
          <button
            v-for="v in VITESSES"
            :key="v"
            class="puce chiffres"
            :aria-pressed="simulation.vitesse === v"
            @click="simulation.vitesse = v"
          >
            ×{{ v }}
          </button>
        </div>
        <p class="note">
          <strong class="chiffres">{{ nombre(simulation.vehicules) }}</strong> véhicules sur le réseau, placés d’après
          les horaires théoriques ({{ RYTHMES[simulation.vitesse] }}). Métros, trams et funiculaires à leurs couleurs, bus
          en terracotta. Zoomez sur une rue&nbsp;: chacun prend sa forme et sa taille réelles.
        </p>
      </template>
    </div>

    <RechercheArret :arrets="arrets" @choisir="(a) => emit('choisirArret', a)" />

    <Legende titre="Courses par heure sur le tronçon" :classes="classesFrequence(sombre)" />

    <FicheArret
      v-if="arret"
      :arret="arret"
      :heure="heure"
      :lignes="lignes"
      @fermer="emit('choisirArret', null)"
      @choisir-heure="choisirHeure"
    />

    <div v-else class="classement">
      <h2 class="sous-titre">Les arrêts les plus desservis sur la journée</h2>
      <ol>
        <li v-for="a in plusDesservis" :key="a.id">
          <button class="classement__ligne" @click="emit('choisirArret', a)">
            <span>{{ a.nom }}</span>
            <span class="chiffres">{{ nombre(a.departs) }}</span>
          </button>
        </li>
      </ol>
      <p class="note">Départs sur la journée, toutes lignes confondues.</p>
    </div>

    <h2 class="sous-titre">Le réseau sur la journée de référence</h2>
    <dl class="tuiles">
      <div><dt>Courses</dt><dd class="chiffres">{{ nombre(meta.courses) }}</dd></div>
      <div><dt>Départs aux arrêts</dt><dd class="chiffres">{{ nombre(meta.departs) }}</dd></div>
      <div><dt>Arrêts desservis</dt><dd class="chiffres">{{ nombre(meta.arrets) }}</dd></div>
      <div><dt>Kilomètres parcourus</dt><dd class="chiffres">{{ nombre(meta.km_commerciaux) }}</dd></div>
    </dl>
  </section>
</template>

<style scoped>
.vehicules {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin-top: -6px;
}
.vehicules strong {
  color: var(--encre);
}
.vehicules__precision {
  margin-top: -14px;
}
</style>
