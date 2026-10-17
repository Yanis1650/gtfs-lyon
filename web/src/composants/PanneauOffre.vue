<script setup lang="ts">
import type { Meta, ProprietesArret, ProprietesLigne } from '../donnees'
import { arreterDefilement } from '../etat/lecture'
import { debutTranche, simulation } from '../etat/simulation'
import { nombre } from '../format'
import FicheArret from './FicheArret.vue'
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

function choisirHeure(i: number) {
  arreterDefilement()
  heure.value = i
  if (simulation.actif) simulation.temps = debutTranche(i)
}

</script>

<template>
  <section class="panneau-vue">
    <div class="panneau-entete">
      <p class="etiquette">Explorer le réseau</p>
      <h2>L’offre, heure par heure.</h2>
    </div>
    <p class="intro">
      Les traits montrent les passages dans l’heure&nbsp;; les disques, les départs aux arrêts.
      Cliquez un arrêt pour le détail.
    </p>

    <RechercheArret :arrets="arrets" @choisir="(a) => emit('choisirArret', a)" />

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

    <details class="complement">
    <summary>Le réseau sur la journée de référence</summary>
    <dl class="tuiles">
      <div><dt>Courses</dt><dd class="chiffres">{{ nombre(meta.courses) }}</dd></div>
      <div><dt>Départs aux arrêts</dt><dd class="chiffres">{{ nombre(meta.departs) }}</dd></div>
      <div><dt>Arrêts desservis</dt><dd class="chiffres">{{ nombre(meta.arrets) }}</dd></div>
      <div><dt>Kilomètres parcourus</dt><dd class="chiffres">{{ nombre(meta.km_commerciaux) }}</dd></div>
    </dl>
    </details>
  </section>
</template>
