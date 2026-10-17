<script setup lang="ts">
import { dateLongue } from '../format'

defineProps<{ date: string | null; sombre: boolean }>()
const emit = defineEmits<{ basculerTheme: [] }>()
</script>

<template>
  <header class="entete">
    <div class="entete__titres">
      <p class="etiquette entete__etiquette">Atlas des transports lyonnais</p>
      <h1>Lyon <span class="entete__relief">sans voiture</span></h1>
      <p class="entete__accroche">Jusqu’où va le réseau TCL&nbsp;?</p>
      <p v-if="date" class="entete__date">Un {{ dateLongue(date) }}, heure par heure.</p>
    </div>
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
/* Les anneaux de la charte : le sillage du drakkar, dont on ne voit que des arcs. */
.entete {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 18px 20px 14px;
  background: repeating-radial-gradient(circle at 118% -18%, var(--arc) 0 1px, transparent 1px 78px);
}
.entete__titres {
  min-width: 0;
}
.entete__etiquette {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  color: var(--terracotta-fort);
}
.entete__etiquette::before {
  content: '';
  flex: none;
  width: 26px;
  height: 2px;
  background: var(--terracotta);
}
h1 {
  font-size: 30px;
  line-height: 1.07;
}
.entete__relief {
  color: var(--terracotta);
}
.entete__accroche {
  margin-top: 8px;
  font-family: var(--police-titre);
  font-size: 18px;
  line-height: 1.35;
  color: var(--ardoise);
}
.entete__date {
  margin-top: 4px;
  font-size: 14px;
  color: var(--encre-2);
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

@media (min-width: 900px) {
  .entete {
    padding: 24px 24px 16px;
  }
  h1 {
    font-size: 34px;
  }
  .entete__accroche {
    font-size: 20px;
  }
}
</style>
