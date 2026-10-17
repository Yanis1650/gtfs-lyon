<script setup lang="ts">
import type { Vue } from '../donnees'
import { VUES } from '../etat/vue'

const vue = defineModel<Vue>({ required: true })
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
.onglets__onglet:hover {
  background: var(--survol);
  color: var(--encre);
}
.onglets__onglet[aria-current='page'] {
  color: var(--sur-ardoise);
  background: var(--ardoise);
}

@media (max-width: 899px) {
  .onglets { justify-content: center; padding: 0; border: 0; }
  .onglets__onglet { flex: 1; min-height: 36px; padding: 7px 6px; font-size: 13px; }
}
</style>
