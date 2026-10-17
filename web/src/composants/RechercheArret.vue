<script setup lang="ts">
import { computed, ref } from 'vue'

import type { ProprietesArret } from '../donnees'
import { correspond, normaliser } from '../recherche'

const props = defineProps<{ arrets: ProprietesArret[] }>()
const emit = defineEmits<{ choisir: [ProprietesArret] }>()
const requete = ref('')
const rechercheActive = computed(() => normaliser(requete.value).length >= 2)
const resultats = computed(() => !rechercheActive.value ? [] : props.arrets
  .filter((a) => correspond(a.nom, requete.value)).sort((a, b) => b.departs - a.departs))

function choisir(arret: ProprietesArret) {
  requete.value = ''
  emit('choisir', arret)
}
</script>

<template>
  <div class="recherche">
    <label class="sous-titre" for="recherche-arret">Rechercher un arrêt</label>
    <input id="recherche-arret" v-model="requete" class="champ-recherche" type="search"
      placeholder="Bellecour, Part-Dieu…" autocomplete="off" @keydown.esc="requete = ''" />
    <template v-if="rechercheActive">
      <p class="note" role="status">{{ resultats.length }} résultat{{ resultats.length > 1 ? 's' : '' }}{{
        resultats.length > 6 ? ' · Les 6 arrêts les plus desservis sont affichés' : '' }}.</p>
      <ul class="recherche__resultats" aria-label="Arrêts trouvés">
        <li v-for="a in resultats.slice(0, 6)" :key="a.id">
          <button class="classement__ligne" @click="choisir(a)">{{ a.nom }}<span aria-hidden="true">→</span></button>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.recherche {
  display: grid;
  gap: 8px;
}
.sous-titre {
  margin: 0;
}
.recherche__resultats {
  padding: 0;
  margin: 0;
  list-style: none;
}
</style>
