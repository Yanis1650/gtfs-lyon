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
  gap: 20px;
  padding: 0 20px;
  border-bottom: 1px solid var(--filet);
  background: var(--surface);
}
.onglets__onglet {
  padding: 12px 0 10px;
  margin-bottom: -1px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  font-size: 15px;
  font-weight: 500;
  color: var(--encre-2);
  cursor: pointer;
  white-space: nowrap;
}
.onglets__onglet:hover {
  color: var(--encre);
}
.onglets__onglet[aria-current='page'] {
  color: var(--encre);
  border-bottom-color: var(--ardoise);
}

@media (min-width: 900px) {
  .onglets {
    padding: 0 24px;
  }
}
</style>
