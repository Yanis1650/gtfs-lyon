<script setup lang="ts">
import type { Classe } from '../palette'

defineProps<{
  titre: string
  classes: Classe[]
  forme?: 'trait' | 'carre'
  note?: string
}>()
</script>

<template>
  <div class="legende">
    <p class="legende__titre">{{ titre }}</p>
    <ul class="legende__liste">
      <li v-for="c in classes" :key="c.libelle" class="legende__classe">
        <span :class="['legende__echantillon', `legende__echantillon--${forme ?? 'trait'}`]" :style="{ background: c.couleur }" />
        <span class="chiffres">{{ c.libelle }}</span>
      </li>
    </ul>
    <p v-if="note" class="legende__note">{{ note }}</p>
  </div>
</template>

<style scoped>
.legende__titre {
  margin-bottom: 8px;
  font-family: var(--police-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--discret);
}
.legende__liste {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 4px 12px;
}
.legende__classe {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--encre);
}
.legende__echantillon {
  flex: none;
  display: inline-block;
}
.legende__echantillon--trait {
  width: 22px;
  height: 5px;
  border-radius: 1px;
}
.legende__echantillon--carre {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px var(--filet);
}
.legende__note {
  margin-top: 6px;
  font-size: 12px;
  color: var(--discret);
}
</style>
