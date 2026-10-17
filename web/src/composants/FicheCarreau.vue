<script setup lang="ts">
import { computed } from 'vue'

import type { Meta, ProprietesCarreau } from '../donnees'
import { minutes, nombre, part } from '../format'

const props = defineProps<{ carreau: ProprietesCarreau; poles: Meta['poles']; total: number }>()
const emit = defineEmits<{ fermer: [] }>()

// Les habitants qu'on rejoint depuis ce carreau, en nombre et en part de la Métropole.
const joignables = computed(() =>
  [
    { libelle: 'En 30 min', n: props.carreau.pop_tc30 },
    { libelle: 'En 45 min', n: props.carreau.pop_tc45 },
    { libelle: 'À pied, en 30 min', n: props.carreau.pop_marche30 },
  ].map((j) => ({ ...j, part: part(j.n / Math.max(props.total, 1)) })),
)

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
      <dt>Habitants du carreau</dt>
      <dd>{{ nombre(carreau.pop) }}</dd>
    </dl>
    <table class="joignables chiffres">
      <caption class="sous-titre">Habitants qu’on rejoint d’ici</caption>
      <thead>
        <tr>
          <td />
          <th scope="col">Habitants</th>
          <th scope="col">Métropole</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="j in joignables" :key="j.libelle">
          <th scope="row">{{ j.libelle }}</th>
          <td>{{ nombre(j.n) }}</td>
          <td>{{ j.part }}</td>
        </tr>
      </tbody>
    </table>
    <p v-if="effetReseau" class="note">
      Le réseau multiplie par {{ effetReseau.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) }} les habitants
      qu’on rejoint à pied en 30&nbsp;min.
    </p>
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
.joignables {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.joignables caption {
  margin: 4px 0 6px;
  text-align: left;
}
.joignables th,
.joignables td {
  padding: 2px 0;
  text-align: right;
  font-weight: 400;
}
.joignables thead th {
  font-family: var(--police);
  font-size: 12px;
  color: var(--discret);
}
.joignables tbody th {
  text-align: left;
  color: var(--encre-2);
}
.joignables td + td,
.joignables th + th {
  padding-left: 12px;
}
.joignables tbody td:last-child {
  font-weight: 600;
}
</style>
