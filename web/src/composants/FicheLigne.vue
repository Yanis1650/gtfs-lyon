<script setup lang="ts">
import { LIBELLES_PERIODES, type ProprietesLigne } from '../donnees'
import { kmh, nombre } from '../format'
import BadgeLigne from './BadgeLigne.vue'

defineProps<{ ligne: ProprietesLigne; vitesseMax: number }>()
const emit = defineEmits<{ fermer: [] }>()
</script>

<template>
  <article class="fiche">
    <div class="fiche__entete">
      <div class="titre-ligne">
        <BadgeLigne :ligne="ligne.ligne" :couleur="ligne.couleur" />
        <h2>{{ ligne.nom }}</h2>
      </div>
      <button class="fiche__fermer" aria-label="Désélectionner la ligne" @click="emit('fermer')">×</button>
    </div>
    <p class="fiche__chiffres chiffres">
      <strong>{{ kmh(ligne.vitesse) }}</strong> en moyenne · {{ nombre(ligne.courses) }} courses
      <template v-if="ligne.longueur_km">· {{ ligne.longueur_km.toLocaleString('fr-FR') }}&nbsp;km de bout en bout</template>
    </p>
    <ul class="periodes">
      <li v-for="(libelle, cle) in LIBELLES_PERIODES" :key="cle">
        <span>{{ libelle }}</span>
        <span class="jauge"><span :style="{ width: `${(100 * (ligne.vitesses[cle] ?? 0)) / vitesseMax}%` }" /></span>
        <span class="chiffres">{{ kmh(ligne.vitesses[cle] ?? null) }}</span>
      </li>
    </ul>
  </article>
</template>

<style scoped>
.titre-ligne {
  display: flex;
  align-items: center;
  gap: 8px;
}
.titre-ligne h2 {
  font-size: 16px;
}
.periodes {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
  font-size: 13px;
}
.periodes li {
  display: grid;
  grid-template-columns: 1fr 70px 78px;
  align-items: center;
  gap: 8px;
}
.periodes li span:last-child {
  text-align: right;
}
</style>
