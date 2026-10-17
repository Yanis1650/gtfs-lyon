<script setup lang="ts">
import { computed } from 'vue'

import type { ProprietesArret, ProprietesLigne } from '../donnees'
import { nombre, tranche } from '../format'
import BadgeLigne from './BadgeLigne.vue'
import BarresProfil from './BarresProfil.vue'

const props = defineProps<{ arret: ProprietesArret; heure: number; lignes: Map<string, ProprietesLigne> }>()
const emit = defineEmits<{ fermer: []; choisirHeure: [number] }>()

const ORDRE = ['metro', 'funiculaire', 'tram', 'trolleybus', 'bus', 'navette_fluviale']
const lignesArret = computed(() =>
  props.arret.lignes
    .map((id) => props.lignes.get(id))
    .filter((l): l is ProprietesLigne => !!l)
    .sort(
      (a, b) =>
        ORDRE.indexOf(a.mode) - ORDRE.indexOf(b.mode) || a.ligne.localeCompare(b.ligne, 'fr', { numeric: true }),
    ),
)
</script>

<template>
  <article class="fiche">
    <div class="fiche__entete">
      <h2>{{ arret.nom }}</h2>
      <button class="fiche__fermer" aria-label="Fermer la fiche de l’arrêt" @click="emit('fermer')">×</button>
    </div>
    <p class="fiche__mesure chiffres">
      <strong>{{ nombre(arret.profil[heure]) }}</strong><span>départs<small>{{ tranche(heure) }}</small></span>
    </p>
    <p class="fiche__chiffres chiffres"><strong>{{ nombre(arret.departs) }}</strong> départs sur la journée, toutes lignes confondues.</p>
    <BarresProfil titre="Départs heure par heure" :valeurs="arret.profil" :actif="heure" @choisir="(i) => emit('choisirHeure', i)" />
    <div class="badges" aria-label="Lignes au départ de l’arrêt">
      <BadgeLigne v-for="l in lignesArret" :key="l.id" :ligne="l.ligne" :couleur="l.couleur" :title="l.nom" />
    </div>
  </article>
</template>

<style scoped>
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
