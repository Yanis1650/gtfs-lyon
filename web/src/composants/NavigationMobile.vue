<script setup lang="ts">
import { computed } from 'vue'
import type { Vue } from '../donnees'

const props = defineProps<{ vue: Vue }>()
const exploration = defineModel<boolean>({ required: true })
const titre = computed(() => props.vue === 'offre' ? 'Arrêts et recherche'
  : props.vue === 'vitesse' ? 'Lignes et filtres' : 'Résultats et détails')
</script>

<template>
  <nav class="navigation-mobile" aria-label="Carte ou exploration">
    <button :aria-pressed="!exploration" aria-controls="atlas-carte" @click="exploration = false">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Zm6-3v15m6-12v15" /></svg>
      Carte
    </button>
    <button :aria-pressed="exploration" aria-controls="atlas-lecture" @click="exploration = true">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></svg>
      {{ titre }}
    </button>
  </nav>
</template>

<style scoped>
.navigation-mobile {
  display: grid;
  grid-template-columns: 1fr 1.7fr;
  gap: 4px;
  padding: 0 10px 4px;
  padding-inline: max(10px, env(safe-area-inset-left, 0px)) max(10px, env(safe-area-inset-right, 0px));
  background: var(--surface);
  border-bottom: 1px solid var(--filet);
}
button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 44px;
  padding: 5px 8px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  font-size: 13px;
  color: var(--encre-2);
  cursor: pointer;
}
button[aria-pressed='true'] { background: var(--plan); color: var(--encre); font-weight: 500; }
svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
@media (min-width: 900px) { .navigation-mobile { display: none; } }
</style>
