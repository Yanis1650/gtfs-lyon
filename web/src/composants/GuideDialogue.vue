<script setup lang="ts">
import { ref } from 'vue'
import type { Vue } from '../donnees'
import Dialogue from './Dialogue.vue'

const emit = defineEmits<{ choisir: [Vue] }>()
const cadre = ref<InstanceType<typeof Dialogue>>()
function choisir(vue: Vue) { emit('choisir', vue); cadre.value?.fermer() }
defineExpose({ ouvrir: () => cadre.value?.ouvrir() })
</script>

<template>
  <Dialogue ref="cadre" id="titre-guide" etiquette="Découvrir l’atlas" titre="Que voulez-vous explorer ?">
    <p class="guide__intro">Trois façons de lire le réseau TCL, à partir de ses horaires théoriques.</p>
    <div class="guide__cartes">
      <section>
        <h3>Les départs</h3>
        <p>Touchez un arrêt pour ses horaires. Changez l’heure avec le curseur fin.</p>
        <p><strong>Animer les véhicules</strong> rapproche la carte pour montrer leur modélisation. <strong>Vue 3D</strong> incline la vue et révèle les bâtiments.</p>
        <button @click="choisir('offre')">Explorer les départs →</button>
      </section>
      <section>
        <h3>Les vitesses</h3>
        <p>Touchez un tronçon pour sa vitesse, ou ouvrez Lignes et filtres pour rechercher et comparer les lignes.</p>
        <button @click="choisir('vitesse')">Comparer les vitesses →</button>
      </section>
      <section>
        <h3>L’accessibilité</h3>
        <p>Choisissez <strong>30 min</strong> ou <strong>45 min</strong> sur la carte : la couleur indique la part de population joignable depuis chaque quartier.</p>
        <p><strong>Depuis un pôle</strong> affiche les temps depuis le point de départ choisi. Touchez un carreau pour le détail.</p>
        <p><strong>Isochrones</strong> trace les zones joignables en 15, 30 et 45 minutes depuis le carreau survolé, ou touché sur téléphone. Cliquez pour fixer le départ.</p>
        <button @click="choisir('acces')">Explorer l’accessibilité →</button>
      </section>
    </div>
    <p class="guide__retour">Sur téléphone, les trois vues restent en bas. Depuis un panneau, glissez à gauche ou à droite,
      ou touchez Carte, pour retrouver la carte. L’aide reste accessible avec le bouton Aide.</p>
  </Dialogue>
</template>

<style scoped>
.guide__intro, .guide__retour { color: var(--encre-2); font-size: 14px; }
.guide__cartes { display: grid; gap: 12px; margin-block: 16px; }
section { padding: 14px 16px; border: 1px solid var(--filet); border-radius: var(--rayon); }
h3 { margin-bottom: 6px; font-size: 19px; }
section p { margin-top: 7px; color: var(--encre-2); font-size: 14px; }
button { min-height: 44px; margin-top: 6px; padding: 8px 0; border: 0; background: transparent; color: var(--terracotta-fort); font: 500 14px var(--police); cursor: pointer; text-align: left; }
button:hover { color: var(--encre); }
.guide__retour { font-size: 13px; }
</style>
