<script setup lang="ts">
import { computed } from 'vue'

import type { ProprietesLigne, ProprietesTroncon } from '../donnees'
import { kmh, nombre } from '../format'
import BadgeLigne from './BadgeLigne.vue'

const props = defineProps<{
  troncon: ProprietesTroncon
  lignes: Map<string, ProprietesLigne>
  nomsArrets: Map<string, string>
  ligne: string | null
}>()
const emit = defineEmits<{ fermer: []; choisirLigne: [string] }>()

const lignesTroncon = computed(() =>
  props.troncon.lignes.map((id) => props.lignes.get(id)).filter((l): l is ProprietesLigne => !!l),
)
</script>

<template>
  <article class="fiche">
    <div class="fiche__entete">
      <h2>{{ nomsArrets.get(troncon.de) }} → {{ nomsArrets.get(troncon.vers) }}</h2>
      <button class="fiche__fermer" aria-label="Fermer la fiche du tronçon" @click="emit('fermer')">×</button>
    </div>
    <p class="fiche__chiffres chiffres">
      <strong>{{ kmh(troncon.vitesse) }}</strong> · {{ nombre(troncon.courses) }} courses dans la journée
    </p>
    <div class="badges" role="group" aria-label="Lignes qui empruntent le tronçon">
      <button
        v-for="l in lignesTroncon"
        :key="l.id"
        class="badges__bouton"
        :title="l.nom"
        :aria-pressed="l.id === ligne"
        @click="emit('choisirLigne', l.id)"
      >
        <BadgeLigne :ligne="l.ligne" :couleur="l.couleur" :actif="l.id === ligne" />
      </button>
    </div>
  </article>
</template>

<style scoped>
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.badges__bouton {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}
</style>
