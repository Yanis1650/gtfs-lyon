<script setup lang="ts">
import { ref } from 'vue'

import type { Meta, ProprietesArret, ProprietesLigne } from '../donnees'
import { nombre } from '../format'
import { classesFrequence } from '../palette'
import FicheArret from './FicheArret.vue'
import Horloge from './Horloge.vue'
import Legende from './Legende.vue'

defineProps<{
  meta: Meta
  sombre: boolean
  arret: ProprietesArret | null
  plusDesservis: ProprietesArret[]
  lignes: Map<string, ProprietesLigne>
}>()
const heure = defineModel<number>('heure', { required: true })
const emit = defineEmits<{ choisirArret: [ProprietesArret | null] }>()

const horloge = ref<InstanceType<typeof Horloge>>()
function choisirHeure(i: number) {
  horloge.value?.arreter()
  heure.value = i
}
</script>

<template>
  <section class="panneau-vue">
    <p class="intro">
      Chaque trait relie deux arrêts, dans un sens. Sa couleur et son épaisseur disent combien de métros, trams et bus
      y passent dans l’heure&nbsp;; chaque disque, combien de départs ont lieu à l’arrêt.
    </p>

    <Horloge ref="horloge" v-model="heure" />

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
      <h2 class="sous-titre">Les arrêts les plus desservis</h2>
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

    <dl class="tuiles">
      <div><dt>Courses</dt><dd class="chiffres">{{ nombre(meta.courses) }}</dd></div>
      <div><dt>Départs aux arrêts</dt><dd class="chiffres">{{ nombre(meta.departs) }}</dd></div>
      <div><dt>Arrêts desservis</dt><dd class="chiffres">{{ nombre(meta.arrets) }}</dd></div>
      <div><dt>Kilomètres parcourus</dt><dd class="chiffres">{{ nombre(meta.km_commerciaux) }}</dd></div>
    </dl>
  </section>
</template>
