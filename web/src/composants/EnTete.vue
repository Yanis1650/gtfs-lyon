<script setup lang="ts">
import { computed } from 'vue'
import { dateLongue } from '../format'

const props = defineProps<{ date: string | null; sombre: boolean }>()
const emit = defineEmits<{ basculerTheme: [] }>()
const dateCourte = computed(() => props.date && new Date(`${props.date}T12:00:00`).toLocaleDateString('fr-FR', {
  day: 'numeric', month: 'short', year: 'numeric',
}))
</script>

<template>
  <header class="entete">
    <div class="entete__titres">
      <p class="etiquette entete__etiquette">Atlas des transports lyonnais</p>
      <h1>Lyon <span class="entete__relief">sans voiture</span></h1>
    </div>
    <div class="entete__navigation"><slot /></div>
    <p v-if="date" class="entete__date" :title="`Horaires théoriques du ${dateLongue(date)}`">
      <span>Horaires théoriques</span><time :datetime="date">{{ dateCourte }}</time>
    </p>
    <button
      class="entete__theme"
      :aria-label="sombre ? 'Passer en thème clair' : 'Passer en thème sombre'"
      @click="emit('basculerTheme')"
    >
      <svg v-if="sombre" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
      </svg>
      <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" /></svg>
    </button>
  </header>
</template>

<style scoped>
.entete {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 24px;
  padding: 12px 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--filet);
}
.entete__titres {
  min-width: 0;
}
.entete__etiquette {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  font-size: 10px;
  letter-spacing: .1em;
}
h1 {
  font-size: 24px;
  line-height: 1.1;
  white-space: nowrap;
}
.entete__relief {
  color: var(--terracotta);
}
.entete__navigation {
  justify-self: center;
}
.entete__date {
  display: flex;
  flex-direction: column;
  font-size: 13px;
  text-align: right;
  color: var(--encre);
  white-space: nowrap;
}
.entete__date span {
  color: var(--discret);
  font-size: 11px;
}
.entete__theme {
  flex: none;
  width: 40px;
  height: 40px;
  border: 1px solid var(--filet);
  border-radius: var(--rayon);
  background: var(--surface);
  display: grid;
  place-items: center;
  cursor: pointer;
}
.entete__theme:hover {
  border-color: var(--ardoise);
}
.entete__theme svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
}

@media (max-width: 1100px) {
  .entete { gap: 14px; padding-inline: 18px; }
  h1 { font-size: 22px; }
}
@media (max-width: 899px) {
  .entete {
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 10px 12px;
    padding: 12px 16px 10px;
  }
  .entete__etiquette, .entete__date span { display: none; }
  .entete__navigation {
    grid-column: 1 / -1;
    grid-row: 2;
    justify-self: stretch;
  }
  .entete__date { font-size: 11px; }
  .entete__theme { width: 34px; height: 34px; }
}
@media (max-width: 379px) {
  .entete { grid-template-columns: minmax(0, 1fr) auto; }
  .entete__date { display: none; }
}
</style>
