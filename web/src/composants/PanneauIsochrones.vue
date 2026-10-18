<script setup lang="ts">
import { computed } from 'vue'
import { isochrones } from '../etat/isochrones'
import { dateLongue, nombre, part } from '../format'

const props = defineProps<{ total: number; date: string }>()
const proportion = computed(() => props.total ? part(isochrones.habitants / props.total) : '—')
</script>

<template>
  <section class="panneau-vue">
    <div class="panneau-entete"><p class="etiquette">Explorer depuis un point</p><h2>Jusqu’où en {{ isochrones.seuil }} min ?</h2></div>
    <p class="intro">Sur la carte, survolez un carreau habité pour voir les zones joignables. Cliquez pour fixer le départ ;
      sur téléphone, touchez un carreau. Depuis le centre permet aussi de choisir le départ au clavier.</p>
    <dl v-if="isochrones.origine" class="tuiles">
      <div><dt>Habitants joignables</dt><dd class="chiffres">{{ nombre(isochrones.habitants) }}</dd></div>
      <div><dt>Part de la Métropole</dt><dd class="chiffres">{{ proportion }}</dd></div>
    </dl>
    <p v-else class="note">Choisissez le départ sur la carte pour afficher un résultat.</p>
    <p class="note">Horaires théoriques du {{ dateLongue(date) }}. Temps médian pour les départs entre
      {{ isochrones.heure }} h et {{ isochrones.heure + isochrones.fenetre / 60 }} h,
      attente et marche à 3,6 km/h comprises. Les zones à 15, 30 et 45 minutes partent du même endroit.</p>
    <p class="note">Les calculs relient les centres des carreaux habités de 200 m. Les contours suivent ces carreaux :
      une zone sans population mesurée n’est pas représentée. Ils ne décrivent ni un trajet porte à porte,
      ni les conditions d’accès pour une personne à mobilité réduite.</p>
    <button class="puce" @click="isochrones.actif = false">Revenir aux indicateurs d’accessibilité</button>
  </section>
</template>
