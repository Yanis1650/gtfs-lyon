<script setup lang="ts">
import { effacerIsochrone, isochrones } from '../etat/isochrones'
import { nombre } from '../format'
</script>

<template>
  <div class="iso-reglages">
    <div class="iso-reglages__seuils" role="group" aria-label="Durée maximale de l’isochrone">
      <button v-for="t in ([15, 30, 45] as const)" :key="t" :aria-pressed="isochrones.seuil === t"
        @click="isochrones.seuil = t">{{ t }} min</button>
    </div>
    <p class="iso-reglages__geste">{{ isochrones.fixe ? 'Départ fixé. Cliquez ailleurs pour le déplacer.' : 'Survolez un carreau ; cliquez pour fixer le départ.' }}</p>
    <p class="iso-reglages__tactile">{{ isochrones.fixe ? 'Départ fixé. Touchez un autre carreau pour le déplacer.' : 'Touchez un carreau pour choisir le départ.' }}</p>
    <p v-if="isochrones.erreur" class="iso-reglages__erreur" role="alert">{{ isochrones.erreur }}</p>
    <p v-else-if="isochrones.chargement" role="status">Chargement de l’isochrone…</p>
    <p v-else-if="isochrones.origine" role="status">
      {{ nombre(isochrones.habitants) }} habitants joignables en {{ isochrones.seuil }} min.
    </p>
    <p class="iso-reglages__methode">TCL + marche · médiane {{ isochrones.heure }} h–{{ isochrones.heure + isochrones.fenetre / 60 }} h · maille 200 m.</p>
    <div class="iso-reglages__actions">
      <button @click="isochrones.centreDemande++">Depuis le centre</button>
      <button v-if="isochrones.origine || isochrones.fixe" @click="effacerIsochrone">Effacer le départ</button>
    </div>
  </div>
</template>

<style scoped>
.iso-reglages { color: var(--encre-2); }
.iso-reglages__seuils { display: flex; gap: 3px; padding-right: 47px; }
button { min-height: 44px; padding: 6px 10px; border: 0; border-radius: 4px; background: transparent; color: inherit; font: inherit; font-size: 12px; cursor: pointer; }
.iso-reglages__seuils button { flex: 1; }
button:hover { background: var(--plan); }
button[aria-pressed='true'] { color: var(--sur-ardoise); background: var(--ardoise); }
p { padding: 3px 7px; font-size: 11px; }
.iso-reglages__tactile { display: none; }
.iso-reglages__methode { color: var(--discret); }
.iso-reglages__erreur { color: var(--terracotta-fort); }
.iso-reglages__actions { display: flex; justify-content: space-between; }
.iso-reglages__actions button { text-decoration: underline; }
@media (pointer: coarse) {
  .iso-reglages__geste { display: none; }
  .iso-reglages__tactile { display: block; }
}
@media (max-width: 599px) {
  .iso-reglages__geste { display: none; }
  .iso-reglages__tactile { display: block; }
}
</style>
