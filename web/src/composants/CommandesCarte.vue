<script setup lang="ts">
import type { Vue } from '../donnees'
import { basculerVehicules } from '../etat/lecture'
import { simulation } from '../etat/simulation'
import { isochrones } from '../etat/isochrones'
import { ouvrirDemonstration } from '../etat/vue'

defineProps<{ vue: Vue; heure: number }>()
const satellite = defineModel<boolean>('satellite', { required: true })
const relief = defineModel<boolean>('relief', { required: true })

const SATELLITE = 'M9 9h6v6H9zM2 8h5v8H2zM17 8h5v8h-5zM7 12h2m6 0h2M12 9V4m-2-1 4 2'
const CUBE = 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5'
const VEHICULE = 'M5 5h14v12H5zM5 10h14M8 5v5m8-5v5M7 17v3m10-3v3M8 14h.01M16 14h.01'
</script>

<template>
  <div :class="['commandes', { 'commandes--offre': vue === 'offre' }]" role="group" aria-label="Explorer la carte">
    <button v-if="vue === 'acces'" class="commandes__bouton" :aria-pressed="isochrones.actif"
      aria-label="Isochrones au survol" @click="isochrones.actif = !isochrones.actif">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16c-4-6 3-14 10-12 8 2 11 10 5 15-5 4-12 1-15-3Zm4-2c-2-3 1-7 5-6 4 1 5 5 2 7-3 2-6 1-7-1Z" /></svg>
      Isochrones
    </button>
    <button v-if="vue === 'offre'" class="commandes__bouton commandes__animation"
      :aria-pressed="simulation.actif" :aria-label="simulation.actif ? 'Masquer les véhicules' : 'Voir le réseau s’animer'"
      :title="simulation.actif ? 'Masquer les véhicules' : 'Démo 3D à 8 h 30 en ×10, d’après les horaires théoriques'"
      @click="simulation.actif ? basculerVehicules(heure) : ouvrirDemonstration()">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="VEHICULE" /></svg>
      <span v-if="simulation.actif">Véhicules animés</span>
      <template v-else><span class="commandes__libelle-long">Voir le réseau s’animer</span><span class="commandes__libelle-court">Voir l’animation</span></template>
    </button>
    <button class="commandes__bouton commandes__relief" :aria-pressed="relief" @click="relief = !relief"
      title="Incliner la carte et voir les bâtiments en 3D">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="CUBE" /></svg>
      Vue 3D
    </button>
    <button class="commandes__bouton commandes__satellite" :aria-pressed="satellite" @click="satellite = !satellite"
      aria-label="Vue satellite" title="Vue satellite">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="SATELLITE" transform="rotate(-35 12 12)" /></svg>
    </button>
  </div>
</template>

<style scoped>
.commandes {
  position: absolute;
  top: 10px;
  left: max(10px, env(safe-area-inset-left, 0px));
  z-index: 3;
  display: flex;
  gap: 6px;
  max-width: calc(100% - 20px);
}
.commandes__bouton {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 9px;
  border: 1px solid var(--filet);
  border-radius: var(--rayon);
  background: var(--surface);
  box-shadow: var(--ombre-douce);
  font: 500 13px/1 var(--police);
  white-space: nowrap;
  color: var(--encre);
  cursor: pointer;
}
.commandes__bouton:hover {
  border-color: var(--ardoise);
}
.commandes__animation {
  border-color: var(--terracotta-fort);
  background: var(--terracotta-fort);
  color: var(--surface);
  font-weight: 600;
}
.commandes__animation:hover { border-color: var(--terracotta-fort); filter: brightness(.95); }
.commandes__libelle-court { display: none; }
.commandes__satellite { width: 44px; padding: 0; justify-content: center; }
.commandes__relief { border-color: var(--ardoise); background: var(--plan); font-weight: 600; }
.commandes__bouton[aria-pressed='true'] {
  background: var(--ardoise);
  border-color: var(--ardoise);
  color: var(--sur-ardoise);
}
.commandes__bouton svg {
  flex: none;
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
@media (max-width: 599px) {
  .commandes__libelle-long { display: none; }
  .commandes__libelle-court { display: inline; }
  .commandes { gap: 4px; }
  .commandes__bouton { padding-inline: 7px; font-size: 12px; }
}
@media (min-width: 900px) {
  .commandes { top: 14px; left: 24px; gap: 8px; }
  .commandes__bouton { padding-inline: 14px; font-size: 14px; }
  .commandes__satellite { padding: 0; }
}
</style>
