<script setup lang="ts">
// Boutons posés sur la carte : fond satellite, et relief (carte inclinée, immeubles debout).
const satellite = defineModel<boolean>('satellite', { required: true })
const relief = defineModel<boolean>('relief', { required: true })

const PHOTO = 'M4 5h16v14H4zM4 16l5-5 4 4 2.5-2.5L20 17'
const CUBE = 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5'
</script>

<template>
  <div class="commandes" role="group" aria-label="Affichage de la carte">
    <button class="commandes__bouton" :aria-pressed="satellite" @click="satellite = !satellite">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="PHOTO" /></svg>
      Satellite
    </button>
    <button class="commandes__bouton" :aria-pressed="relief" @click="relief = !relief">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="CUBE" /></svg>
      3D
    </button>
  </div>
</template>

<style scoped>
.commandes {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 3;
  display: flex;
  gap: 6px;
}
.commandes__bouton {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--filet);
  border-radius: var(--rayon);
  background: var(--surface);
  box-shadow: var(--ombre-douce);
  font: 500 14px/1 var(--police);
  color: var(--encre);
  cursor: pointer;
}
.commandes__bouton:hover {
  border-color: var(--ardoise);
}
.commandes__bouton[aria-pressed='true'] {
  background: var(--ardoise);
  border-color: var(--ardoise);
  color: var(--sur-ardoise);
}
.commandes__bouton svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
