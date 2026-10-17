<script setup lang="ts">
import { computed, ref } from 'vue'

import { heure, nombre, tranche } from '../format'

const props = withDefaults(
  defineProps<{
    valeurs: number[]
    actif?: number | null
    unite?: string
    titre: string
  }>(),
  { actif: null, unite: 'départs' },
)
const emit = defineEmits<{ choisir: [number] }>()

const L = 320
const H = 96
const BAS = 18
const ECART = 2

const max = computed(() => Math.max(1, ...props.valeurs))
const largeur = computed(() => (L - ECART * (props.valeurs.length - 1)) / props.valeurs.length)
const survol = ref<number | null>(null)

// Barre ancrée sur la ligne de base, extrémité haute arrondie à 3 px.
function chemin(i: number): string {
  const h = ((H - BAS) * props.valeurs[i]) / max.value
  if (h <= 0) return ''
  const x = i * (largeur.value + ECART)
  const w = largeur.value
  const r = Math.min(3, w / 2, h)
  const y = H - BAS - h
  return `M${x},${H - BAS} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${H - BAS} Z`
}

const graduations = [0, 4, 8, 12, 16, 20]
const bulle = computed(() =>
  survol.value == null ? null : `${tranche(survol.value)} : ${nombre(props.valeurs[survol.value])} ${props.unite}`,
)
</script>

<template>
  <figure class="profil">
    <figcaption class="profil__titre">{{ titre }}</figcaption>
    <div class="profil__zone">
      <svg :viewBox="`0 0 ${L} ${H}`" role="img" :aria-label="titre" @mouseleave="survol = null">
        <line :x1="0" :x2="L" :y1="H - BAS + 0.5" :y2="H - BAS + 0.5" class="profil__base" />
        <g v-for="(_, i) in valeurs" :key="i">
          <path
            :d="chemin(i)"
            :class="['profil__barre', { 'profil__barre--actif': i === actif, 'profil__barre--survol': i === survol }]"
          />
          <rect
            :x="i * (largeur + ECART) - ECART / 2"
            y="0"
            :width="largeur + ECART"
            :height="H"
            class="profil__cible"
            @mouseenter="survol = i"
            @click="emit('choisir', i)"
          />
        </g>
        <text
          v-for="g in graduations"
          :key="g"
          :x="g * (largeur + ECART)"
          :y="H - 4"
          class="profil__graduation"
        >
          {{ heure(g) }}
        </text>
      </svg>
      <div v-if="bulle" class="profil__bulle chiffres" role="status">{{ bulle }}</div>
    </div>
    <!-- Un tableau ignore la hauteur qu'on lui impose : c'est son conteneur qui le cache. -->
    <div class="visuellement-cache">
      <table>
        <caption>{{ titre }}</caption>
        <tr v-for="(v, i) in valeurs" :key="i">
          <th scope="row">{{ tranche(i) }}</th>
          <td>{{ v }}</td>
        </tr>
      </table>
    </div>
  </figure>
</template>

<style scoped>
.profil {
  margin: 0;
}
.profil__titre {
  margin-bottom: 8px;
  font-family: var(--police-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--discret);
}
.profil__zone {
  position: relative;
}
svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
.profil__base {
  stroke: var(--axe);
  stroke-width: 1;
}
.profil__barre {
  fill: var(--barre);
  opacity: 0.55;
  transition: opacity 0.15s;
}
.profil__barre--actif,
.profil__barre--survol {
  opacity: 1;
}
.profil__barre--actif {
  fill: var(--barre-active);
}
.profil__cible {
  fill: transparent;
  cursor: pointer;
}
.profil__graduation {
  font-family: var(--police-mono);
  font-size: 9.5px;
  fill: var(--discret);
  font-variant-numeric: tabular-nums;
}
.profil__bulle {
  position: absolute;
  top: -6px;
  right: 0;
  padding: 2px 8px;
  border: 1px solid var(--filet);
  border-radius: var(--rayon);
  background: var(--surface);
  box-shadow: var(--ombre-douce);
  font-size: 12px;
  color: var(--encre);
  pointer-events: none;
}
</style>
