<script setup lang="ts">
import { type Map as CarteMapLibre, Marker, type Popup } from 'maplibre-gl'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import {
  ajouterCouches,
  appliquerAcces,
  appliquerHeure,
  appliquerModes,
  appliquerSelection,
  type Donnees,
  emprise,
  montrerVue,
} from '../carte/couches'
import type { Reglages } from '../carte/expressions'
import { brancherInteractions } from '../carte/interactions'
import { creerCarte, styleFond } from '../carte/maplibre'
import {
  chargerArrets,
  chargerCarreaux,
  chargerLignes,
  chargerTroncons,
  type IndicateurAcces,
  type Meta,
  type Mode,
  type ProprietesArret,
  type ProprietesCarreau,
  type ProprietesTroncon,
  type Vue,
} from '../donnees'

const props = defineProps<{
  vue: Vue
  heure: number
  sombre: boolean
  meta: Meta | null
  modes: Mode[]
  indicateur: IndicateurAcces
  pole: string
  ligne: string | null
  arret: string | null
  carreau: string | null
}>()

const emit = defineEmits<{
  arret: [ProprietesArret | null]
  troncon: [ProprietesTroncon | null]
  carreau: [ProprietesCarreau | null]
}>()

const conteneur = ref<HTMLElement>()
const chargement = ref(true)
let carte: CarteMapLibre | null = null
let bulle: Popup | null = null
let marqueurPole: Marker | null = null
const donnees: Partial<Donnees> = {}

const reglages = computed<Reglages>(() => ({
  heure: props.heure,
  sombre: props.sombre,
  modes: props.modes,
  indicateur: props.indicateur,
  pole: props.pole,
}))
const selection = computed(() => ({ ligne: props.ligne, arret: props.arret, carreau: props.carreau }))
const pret = () => !!carte?.getLayer('troncons-offre')

async function construire() {
  const [arrets, troncons, lignes] = await Promise.all([chargerArrets(), chargerTroncons(), chargerLignes()])
  if (!carte) return
  Object.assign(donnees, { arrets, troncons, lignes })
  ajouterCouches(carte, { carreaux: null, ...donnees } as Donnees, reglages.value, selection.value)
  await afficherVue()
  chargement.value = false
}

async function afficherVue() {
  if (!carte || !pret()) return
  montrerVue(carte, props.vue)
  bulle?.remove()
  if (props.vue === 'acces' && !donnees.carreaux) {
    chargement.value = true
    donnees.carreaux = await chargerCarreaux()
    chargement.value = false
  }
  const source = carte.getSource('carreaux') as { setData?: (d: unknown) => void } | undefined
  if (props.vue === 'acces' && donnees.carreaux) source?.setData?.(donnees.carreaux)
  placerPole()
}

function placerPole() {
  marqueurPole?.remove()
  marqueurPole = null
  if (!carte || props.vue !== 'acces' || props.indicateur !== 'temps') return
  const pole = props.meta?.poles.find((p) => p.id === props.pole)
  if (!pole) return
  const el = document.createElement('div')
  el.className = 'marqueur-pole'
  el.title = pole.nom
  marqueurPole = new Marker({ element: el }).setLngLat([pole.lon, pole.lat]).addTo(carte)
}

onMounted(async () => {
  const etroit = window.matchMedia('(max-width: 899px)').matches
  // Sur téléphone, deux doigts pour déplacer la carte : un doigt fait défiler la page.
  carte = await creerCarte(conteneur.value!, props.sombre, { cooperativeGestures: etroit })
  if (import.meta.env.DEV) Object.assign(window, { carteAtlas: carte })
  carte.on('style.load', () => void construire())
  bulle = brancherInteractions(
    carte,
    {
      vue: () => props.vue,
      heure: () => props.heure,
      indicateur: () => props.indicateur,
      pole: () => props.pole,
      nomPole: () => props.meta?.poles.find((p) => p.id === props.pole)?.nom ?? '',
    },
    { arret: (a) => emit('arret', a), troncon: (t) => emit('troncon', t), carreau: (c) => emit('carreau', c) },
  )
})

onBeforeUnmount(() => {
  carte?.remove()
  carte = null
})

watch(() => props.vue, afficherVue)
watch(() => props.heure, () => pret() && appliquerHeure(carte!, reglages.value))
watch(() => props.modes, () => pret() && appliquerModes(carte!, reglages.value))
watch(
  () => [props.indicateur, props.pole],
  () => {
    if (!pret()) return
    appliquerAcces(carte!, reglages.value)
    placerPole()
  },
)
watch(selection, (s, avant) => {
  if (!pret()) return
  appliquerSelection(carte!, s)
  const trace = s.ligne && s.ligne !== avant?.ligne ? donnees.lignes?.features.find((f) => f.properties.id === s.ligne) : null
  if (trace) carte!.fitBounds(emprise(trace.geometry), { padding: 60, duration: 900, maxZoom: 14 })
})
watch(
  () => props.sombre,
  async (sombre) => {
    chargement.value = true
    carte?.setStyle(await styleFond(sombre))
  },
)

defineExpose({
  voler(lon: number, lat: number, zoom = 14) {
    carte?.flyTo({ center: [lon, lat], zoom, duration: 1200 })
  },
})
</script>

<template>
  <div class="carte">
    <div ref="conteneur" class="carte__fond" role="region" aria-label="Carte du réseau TCL" />
    <div v-if="chargement" class="carte__chargement" role="status">Chargement des données…</div>
  </div>
</template>

<style scoped>
.carte {
  position: relative;
  width: 100%;
  height: 100%;
}
.carte__fond {
  position: absolute;
  inset: 0;
}
.carte__chargement {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 12px;
  border: 1px solid var(--filet);
  border-radius: var(--rayon);
  background: var(--surface);
  box-shadow: var(--ombre-douce);
  font-size: 13px;
  color: var(--encre-2);
}
:global(.marqueur-pole) {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--terracotta);
  border: 3px solid var(--surface);
  box-shadow: 0 0 0 2px var(--encre);
}
</style>
