<script setup lang="ts">
import { computed } from 'vue'

import { LIBELLES_MODES, type Meta, type Mode, type ProprietesLigne, type ProprietesTroncon } from '../donnees'
import { kmh } from '../format'
import ClassementLignes from './ClassementLignes.vue'
import FicheLigne from './FicheLigne.vue'
import FicheTroncon from './FicheTroncon.vue'

const props = defineProps<{
  meta: Meta
  sombre: boolean
  lignes: Map<string, ProprietesLigne>
  nomsArrets: Map<string, string>
  modes: Mode[]
  ligne: string | null
  troncon: ProprietesTroncon | null
}>()
const emit = defineEmits<{
  'update:modes': [Mode[]]
  choisirLigne: [string | null]
  fermerTroncon: []
}>()

const MODES_FILTRABLES: Mode[] = ['metro', 'tram', 'trolleybus', 'bus', 'funiculaire', 'navette_fluviale']
const ORDRE_TUILES: Mode[] = ['metro', 'tram', 'bus', 'trolleybus']

function basculer(mode: Mode) {
  const actifs = props.modes.includes(mode) ? props.modes.filter((m) => m !== mode) : [...props.modes, mode]
  emit('update:modes', actifs)
}

const vitesseMax = computed(() => Math.max(1, ...[...props.lignes.values()].map((l) => l.vitesse ?? 0)))
const ligneChoisie = computed(() => (props.ligne ? (props.lignes.get(props.ligne) ?? null) : null))
const modesAffiches = computed(() =>
  ORDRE_TUILES.map((mode) => props.meta.modes.find((m) => m.mode === mode)).filter((m) => m !== undefined),
)
</script>

<template>
  <section class="panneau-vue">
    <div class="panneau-entete"><p class="etiquette">Comparer les lignes</p><h2>Le rythme du réseau.</h2></div>
    <p class="intro">
      La vitesse commerciale rapporte la distance parcourue au temps prévu dans les horaires, arrêts compris.
      Terracotta&nbsp;: plus lent que l’allure typique du réseau&nbsp;; ardoise&nbsp;: plus rapide.
    </p>

    <FicheTroncon
      v-if="troncon"
      :troncon="troncon"
      :lignes="lignes"
      :noms-arrets="nomsArrets"
      :ligne="ligne"
      @fermer="emit('fermerTroncon')"
      @choisir-ligne="(id) => emit('choisirLigne', id)"
    />
    <FicheLigne v-if="ligneChoisie" :ligne="ligneChoisie" :vitesse-max="vitesseMax" @fermer="emit('choisirLigne', null)" />

    <dl class="tuiles">
      <div v-for="m in modesAffiches" :key="m.mode">
        <dt>{{ LIBELLES_MODES[m.mode] }}</dt>
        <dd class="chiffres">{{ kmh(m.vitesse) }}</dd>
      </div>
    </dl>

    <div class="puces" role="group" aria-label="Modes affichés">
      <button
        v-for="m in MODES_FILTRABLES"
        :key="m"
        class="puce"
        :aria-pressed="modes.includes(m)"
        @click="basculer(m)"
      >
        {{ LIBELLES_MODES[m] }}
      </button>
    </div>


    <ClassementLignes
      :lignes="lignes"
      :modes="modes"
      :ligne="ligne"
      :vitesse-max="vitesseMax"
      @choisir="(id) => emit('choisirLigne', id)"
    />
  </section>
</template>
