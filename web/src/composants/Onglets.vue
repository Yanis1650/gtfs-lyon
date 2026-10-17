<script setup lang="ts">
import type { Vue } from '../donnees'
import { VUES } from '../etat/vue'

const vue = defineModel<Vue>({ required: true })
const ICONES = {
  offre: 'M4 6h16M4 12h12M4 18h8',
  vitesse: 'M4 18a9 9 0 1 1 16 0M12 13l5-5M7 17h10',
  acces: 'M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12Zm0-15a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
}
</script>

<template>
  <nav class="onglets" aria-label="Vues de l’atlas">
    <button
      v-for="v in VUES"
      :key="v.id"
      class="onglets__onglet"
      :aria-current="vue === v.id ? 'page' : undefined"
      @click="vue = v.id"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="ICONES[v.id]" /></svg>
      {{ v.titre }}
    </button>
  </nav>
</template>

<style scoped>
.onglets {
  display: flex;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--filet);
  border-radius: var(--rayon);
  background: var(--surface);
}
.onglets__onglet {
  min-height: 38px;
  padding: 8px 14px;
  border: none;
  border-radius: 4px;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: var(--encre-2);
  cursor: pointer;
  white-space: nowrap;
}
.onglets__onglet svg { display: none; }
.onglets__onglet:hover {
  background: var(--survol);
  color: var(--encre);
}
.onglets__onglet[aria-current='page'] {
  color: var(--sur-ardoise);
  background: var(--ardoise);
}

@media (max-width: 899px) {
  .onglets {
    justify-content: stretch;
    gap: 0;
    height: var(--hauteur-navigation);
    padding: 4px max(6px, env(safe-area-inset-left, 0px)) calc(4px + env(safe-area-inset-bottom, 0px));
    border: 0;
    border-top: 1px solid var(--filet);
    border-radius: 0;
  }
  .onglets__onglet {
    flex: 1;
    min-width: 0;
    min-height: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 3px;
    font-size: 12px;
  }
  .onglets__onglet[aria-current='page'] { background: var(--plan); color: var(--encre); }
  .onglets__onglet svg { display: block; width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
}
</style>
