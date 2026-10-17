<script setup lang="ts">
import { computed } from 'vue'

import { encreSur } from '../palette'

const props = defineProps<{ ligne: string; couleur: string; actif?: boolean }>()
const encre = computed(() => encreSur(props.couleur))
// Les rares noms longs (Rhônexpress) gardent leur nom complet en infobulle.
const court = computed(() => (props.ligne.length > 5 ? props.ligne.slice(0, 2).toUpperCase() : props.ligne))
</script>

<template>
  <span class="badge" :class="{ 'badge--actif': actif }" :style="{ background: couleur, color: encre }" :title="court !== ligne ? ligne : undefined">{{ court }}</span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 22px;
  padding: 0 6px;
  border-radius: var(--rayon);
  font-family: var(--police-titre);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
}
.badge--actif {
  outline: 2px solid var(--encre);
  outline-offset: 1px;
}
</style>
