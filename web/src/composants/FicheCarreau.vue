<script setup lang="ts">
import { computed } from 'vue'

import type { Meta, ProprietesCarreau } from '../donnees'
import { minutes, nombre } from '../format'

const props = defineProps<{ carreau: ProprietesCarreau; poles: Meta['poles'] }>()
const emit = defineEmits<{ fermer: [] }>()

// Combien de fois plus d'habitants le réseau met à portée, comparé à la marche seule.
const effetReseau = computed(() =>
  props.carreau.pop_marche30 > 0 ? props.carreau.pop_tc30 / props.carreau.pop_marche30 : null,
)
</script>

<template>
  <article class="fiche">
    <div class="fiche__entete">
      <h2>Ce carreau</h2>
      <button class="fiche__fermer" aria-label="Fermer la fiche du carreau" @click="emit('fermer')">×</button>
    </div>
    <dl class="detail chiffres">
      <dt>Habitants</dt>
      <dd>{{ nombre(carreau.pop) }}</dd>
      <dt>Joignables en 30&nbsp;min</dt>
      <dd>{{ nombre(carreau.pop_tc30) }}</dd>
      <dt>Joignables en 45&nbsp;min</dt>
      <dd>{{ nombre(carreau.pop_tc45) }}</dd>
      <dt>À pied, en 30&nbsp;min</dt>
      <dd>{{ nombre(carreau.pop_marche30) }}</dd>
      <template v-if="effetReseau">
        <dt>Effet du réseau</dt>
        <dd>×&nbsp;{{ effetReseau.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) }}</dd>
      </template>
    </dl>
    <p class="sous-titre">Temps de trajet depuis</p>
    <dl class="detail chiffres">
      <template v-for="p in poles" :key="p.id">
        <dt>{{ p.nom }}</dt>
        <dd>{{ minutes(carreau[`t_${p.id}`] as number | null) }}</dd>
      </template>
    </dl>
  </article>
</template>

<style scoped>
.detail {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 12px;
  margin: 0;
  font-size: 14px;
}
.detail dt {
  color: var(--encre-2);
}
.detail dd {
  margin: 0;
  text-align: right;
}
.sous-titre {
  margin: 4px 0 -4px;
}
</style>
