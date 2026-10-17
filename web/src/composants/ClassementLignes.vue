<script setup lang="ts">
import { computed, ref } from 'vue'

import type { Mode, ProprietesLigne } from '../donnees'
import { kmh } from '../format'
import { correspond } from '../recherche'
import BadgeLigne from './BadgeLigne.vue'

const props = defineProps<{
  lignes: Map<string, ProprietesLigne>
  modes: Mode[]
  ligne: string | null
  vitesseMax: number
}>()
const emit = defineEmits<{ choisir: [string | null] }>()

const ordre = ref<'rapides' | 'lentes'>('rapides')
const requete = ref('')
const classement = computed(() => {
  const liste = [...props.lignes.values()].filter((l) => l.vitesse != null && props.modes.includes(l.mode)
    && correspond(`${l.ligne} ${l.nom}`, requete.value))
  const sens = ordre.value === 'rapides' ? -1 : 1
  return liste.sort((a, b) => sens * (a.vitesse! - b.vitesse!))
})
</script>

<template>
  <div>
    <div class="entete">
      <h2 class="sous-titre">Les lignes, de la plus {{ ordre === 'rapides' ? 'rapide' : 'lente' }}</h2>
      <button class="lien-action" @click="ordre = ordre === 'rapides' ? 'lentes' : 'rapides'">Inverser</button>
    </div>
    <label class="visuellement-cache" for="recherche-ligne">Rechercher une ligne ou une destination</label>
    <input id="recherche-ligne" v-model="requete" class="champ-recherche" type="search"
      placeholder="Rechercher : T1, C3, Part-Dieu…" autocomplete="off" @keydown.esc="requete = ''" />
    <p v-if="!classement.length" class="note" role="status">Aucune ligne pour cette recherche et les modes affichés.</p>
    <ol class="lignes">
      <li v-for="l in classement" :key="l.id">
        <button
          class="lignes__ligne"
          :class="{ 'lignes__ligne--actif': l.id === ligne }"
          :aria-pressed="l.id === ligne"
          :title="l.nom"
          @click="emit('choisir', l.id === ligne ? null : l.id)"
        >
          <BadgeLigne :ligne="l.ligne" :couleur="l.couleur" />
          <span class="jauge"><span :style="{ width: `${(100 * l.vitesse!) / vitesseMax}%` }" /></span>
          <span class="chiffres lignes__valeur">{{ kmh(l.vitesse) }}</span>
        </button>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.entete {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.lien-action {
  font-size: 14px;
}
.lignes {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
}
.lignes__ligne {
  width: calc(100% + 16px);
  margin: 0 -8px;
  display: grid;
  grid-template-columns: 52px 1fr 80px;
  align-items: center;
  gap: 10px;
  min-height: 36px;
  padding: 4px 8px;
  border: none;
  border-radius: var(--rayon);
  background: transparent;
  cursor: pointer;
}
.lignes__ligne:hover {
  background: var(--survol);
}
.lignes__ligne--actif {
  background: var(--survol);
  box-shadow: inset 0 0 0 1px var(--ardoise);
}
.lignes__valeur {
  text-align: right;
  font-size: 13px;
  color: var(--encre-2);
}
</style>
