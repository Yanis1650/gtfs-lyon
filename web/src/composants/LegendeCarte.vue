<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IndicateurAcces, Vue } from '../donnees'
import { classesFrequence, classesPart, classesTemps, classesVitesse } from '../palette'

const props = defineProps<{ vue: Vue; sombre: boolean; indicateur: IndicateurAcces }>()
const ouverte = ref(!window.matchMedia('(max-width: 599px)').matches)
const classes = computed(() => props.vue === 'offre' ? classesFrequence(props.sombre)
  : props.vue === 'vitesse' ? classesVitesse(props.sombre)
  : props.indicateur === 'temps' ? classesTemps(props.sombre) : classesPart(props.sombre))
const titre = computed(() => props.vue === 'offre' ? 'Passages par heure'
  : props.vue === 'vitesse' ? 'Vitesse commerciale · km/h'
  : props.indicateur === 'temps' ? 'Temps de trajet · minutes'
  : `Habitants joignables en ${props.indicateur === 'pop_tc45' ? 45 : 30} min`)
</script>

<template>
  <aside :class="['legende-carte', { 'legende-carte--ouverte': ouverte }]" aria-label="Lecture des couleurs">
    <button class="legende-carte__titre" :aria-expanded="ouverte" aria-controls="couleurs-carte" @click="ouverte = !ouverte">
      {{ titre }} <span aria-hidden="true">{{ ouverte ? '−' : '+' }}</span>
    </button>
    <div v-if="ouverte" id="couleurs-carte" class="legende-carte__contenu">
      <div class="legende-carte__rampe" aria-hidden="true">
        <span v-for="c in classes" :key="c.min" :style="{ background: c.couleur }" />
      </div>
      <div class="legende-carte__bornes"><span>{{ classes[0].libelle }}</span><span>{{ classes.at(-1)?.libelle }}</span></div>
      <details class="legende-carte__detail">
        <summary>Toutes les classes</summary>
        <ul>
          <li v-for="c in classes" :key="c.min"><span :style="{ background: c.couleur }" aria-hidden="true" />{{ c.libelle }}</li>
        </ul>
      </details>
      <p v-if="vue === 'vitesse'">Épaisseur : courses sur la journée.</p>
      <p v-else-if="vue === 'offre'">Traits : passages · Disques : départs.</p>
    </div>
  </aside>
</template>

<style scoped>
.legende-carte {
  width: 250px;
  max-width: calc(100% - 32px);
  border: 1px solid var(--filet);
  border-radius: var(--rayon);
  background: var(--surface);
  color: var(--encre-2);
  box-shadow: var(--ombre-douce);
  font-size: 12px;
}
.legende-carte__titre {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 38px;
  padding: 9px 12px;
  border: 0;
  border-radius: var(--rayon);
  background: transparent;
  text-align: left;
  font-weight: 500;
  cursor: pointer;
}
.legende-carte__titre span { font-size: 16px; }
.legende-carte__contenu { padding: 0 12px 10px; }
.legende-carte__rampe { display: flex; height: 5px; border-radius: 2px; overflow: hidden; }
.legende-carte__rampe span { flex: 1; }
.legende-carte__bornes { display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px; }
.legende-carte__detail { margin-top: 7px; }
.legende-carte__detail summary { cursor: pointer; color: var(--discret); font-size: 11px; }
.legende-carte__detail ul { list-style: none; margin: 8px 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.legende-carte__detail li { display: flex; align-items: center; gap: 5px; font-size: 11px; }
.legende-carte__detail li span { width: 12px; height: 5px; }
.legende-carte p { margin-top: 6px; color: var(--discret); font-size: 11px; }
@media (max-width: 599px) {
  .legende-carte { width: 230px; }
  .legende-carte:not(.legende-carte--ouverte) { width: auto; }
  .legende-carte__titre { min-height: 44px; }
}
</style>
